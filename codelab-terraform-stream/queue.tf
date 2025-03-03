
# Pull the latest redpanda image
resource "docker_image" "redpanda_image" {
  name         = "redpandadata/redpanda:${var.redpanda_version}"
  keep_locally = false
}

# Create a redpanda container
resource "docker_container" "queue" {
  name              = "redpanda"
  image             = docker_image.redpanda_image.image_id
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
  command = [
     "redpanda",
    "start",
    "--kafka-addr internal://0.0.0.0:9092,external://0.0.0.0:19092",
    # Address the broker advertises to clients that connect to the Kafka API.
    # Use the internal addresses to connect to the Redpanda brokers'
    # from inside the same Docker network.
    # Use the external addresses to connect to the Redpanda brokers'
    # from outside the Docker network.
    "--advertise-kafka-addr internal://redpanda:9092,external://localhost:19092",
    "--pandaproxy-addr internal://0.0.0.0:8082,external://0.0.0.0:18082",
      # Address the broker advertises to clients that connect to the HTTP Proxy.
    "--advertise-pandaproxy-addr internal://redpanda:8082,external://localhost:18082",
    "--schema-registry-addr internal://0.0.0.0:8081,external://0.0.0.0:18081",
      # Redpanda brokers use the RPC API to communicate with each other internally.
    "--rpc-addr redpanda:33145",
    "--advertise-rpc-addr redpanda:33145",
      # Mode dev-container uses well-known configuration properties for development in containers.
    "--mode dev-container",
      # Tells Seastar (the framework Redpanda uses under the hood) to use 1 core on the system.
    "--smp 1",
    "--default-log-level=info",
  ]
  ports {
    external = 18081
    internal = 18081
  }
  ports {
    external = 18082
    internal = 18082
  }
  ports {
    external = 19092
    internal = 19092
  }
  ports {
    external = 19644
    internal = 9644
  }

  volumes {
    container_path = "/var/lib/redpanda/data"
    host_path      = "${path.cwd}/redpanda/data"
  }
}

# Pull the latest redpanda console image
resource "docker_image" "redpanda_console_image" {
  name         = "docker.redpanda.com/redpandadata/console:${var.redpanda_version}"
  keep_locally = false
}

# Create a redpanda console container
resource "docker_container" "queue_console" {
  name              = "redpanda_console"
  image             = docker_image.redpanda_console_image.image_id
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
  env = [
    "KAFKA_BROKERS=${docker_container.queue.name}:9092"
  ]
  ports {
    external = 9090
    internal = 8080
  }
}

