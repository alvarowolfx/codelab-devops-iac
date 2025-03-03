
# Pull the latest Bento image
resource "docker_image" "bento_image" {
  name         = "ghcr.io/warpstreamlabs/bento:${var.bento_version}"
  keep_locally = false
}

resource "local_file" "bento_source_config" {
  content = templatefile("${path.module}/bento-source.tftpl", {        
    redpanda_address = "${docker_container.queue.name}:9092",
    output_topic = "coinbase_input_messages"
  })
  filename = "${path.cwd}/config/bento-source.yaml"
}

resource "local_file" "bento_ingestor_config" {
  content = templatefile("${path.module}/bento-ingestor.tftpl", {
    redpanda_address = "${docker_container.queue.name}:9092"
    connection_string = "postgresql://${postgresql_role.pipeline_role.name}:${var.pipeline_user_password}@${docker_container.db.network_data[0].ip_address}:${docker_container.db.ports[0].external}/${postgresql_database.pipeline_db.name}?sslmode=disable"
    input_topic = "coinbase_input_messages"
  })
  filename = "${path.cwd}/config/bento-ingestor.yaml"
}

# Create a bento container
resource "docker_container" "pipeline" {
  for_each = toset(["source", "ingestor"])
  name              = "bento-${each.value}"
  image             = docker_image.bento_image.image_id
  publish_all_ports = true
  must_run          = true
  restart           = "always"
  network_mode      = "bridge"
  networks_advanced {
    name = docker_network.pipeline_network.name
  }
  log_opts = {
    "max-size" = "10m"
    "max-file" = "5"
  }
  ports {
    internal = 8080
  }

  volumes {
    container_path = "/bento.yaml"
    host_path      = "${path.cwd}/config/bento-${each.value}.yaml"
  }
}

