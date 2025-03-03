
# Pull the latest grafana image
resource "docker_image" "grafana_image" {
  name         = "grafana/grafana:${var.grafana_version}"
  keep_locally = false
}

# Create a grafana container
resource "docker_container" "grafana" {
  name              = "grafana"
  image             = docker_image.grafana_image.image_id
  publish_all_ports = true
  must_run          = true
  restart           = "always"
  networks_advanced {
    name = docker_network.pipeline_network.name
  }
  network_mode = "bridge"
  log_opts = {
    "max-size" = "10m"
    "max-file" = "5"
  }
  ports {
    external = 3000
    internal = 3000
  }

  volumes {
    container_path = "/var/lib/grafana"
    host_path      = "${path.cwd}/grafana/data"
  }
}

