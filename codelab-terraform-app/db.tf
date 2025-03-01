
# Pull the latest postgresql image
resource "docker_image" "db_image" {
  name         = "postgres:${var.db_version}"
  keep_locally = false
}

# Create a postgres container
resource "docker_container" "db" {
  name              = "postgres"
  image             = docker_image.db_image.image_id
  publish_all_ports = true
  must_run          = true
  restart           = "always"
  networks_advanced {
    name = docker_network.app_network.name
  }
  network_mode = "bridge"
  log_opts = {
    "max-size" = "10m"
    "max-file" = "5"
  }
  ports {
    external = var.db_port
    internal = 5432
  }

  env = [
    "POSTGRES_PASSWORD=${var.postgres_password}"
  ]

  volumes {
    container_path = "/var/lib/postgresql/data"
    host_path      = "${path.cwd}/postgres/data"
  }
}

resource "postgresql_database" "app_db" {
  name       = "nocodb"
  depends_on = [docker_container.db]
}

resource "postgresql_role" "app_role" {
  name       = "nocodb"
  login      = true
  password   = var.app_user_password
  depends_on = [docker_container.db]
}

resource "postgresql_grant" "app_role_grants" {
  role        = postgresql_role.app_role.name
  database    = postgresql_database.app_db.name
  schema      = "public"
  object_type = "schema"
  privileges  = ["ALL"]
}

