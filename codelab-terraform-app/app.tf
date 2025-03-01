
# Pull the latest NocoDB image
resource "docker_image" "app_image" {
  name         = "nocodb/nocodb:${var.app_version}"
  keep_locally = false
}

# Create a nocodb container
resource "docker_container" "app" {
  name              = "nocodb"
  image             = docker_image.app_image.image_id
  publish_all_ports = true
  must_run          = true
  restart           = "always"
  network_mode      = "bridge"
  networks_advanced {
    name = docker_network.app_network.name
  }
  log_opts = {
    "max-size" = "10m"
    "max-file" = "5"
  }
  ports {
    internal = 8080
  }

  env = [
    "NC_DB=pg://${docker_container.db.name}:5432?u=nocodb&p=${var.app_user_password}&d=nocodb"
    #"NC_AUTH_JWT_SECRET=${ auth_secret }"
  ]

  volumes {
    container_path = "/usr/app/data"
    host_path      = "${path.cwd}/nocodb/data"
  }
}

