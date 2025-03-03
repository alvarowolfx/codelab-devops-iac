
# Pull the latest timescaledb image
resource "docker_image" "timescaledb_image" {
  name         = "timescale/timescaledb:${var.timescaledb_version}"
  keep_locally = false
}

# Create a timescaledb container
resource "docker_container" "db" {
  name              = "timescaledb"
  image             = docker_image.timescaledb_image.image_id
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

resource "postgresql_database" "pipeline_db" {
  name       = "pipeline"

  depends_on = [docker_container.db]
}

resource "postgresql_role" "pipeline_role" {
  name       = "pipeline"
  login      = true
  password   = var.pipeline_user_password
  depends_on = [docker_container.db]
}

resource "postgresql_grant" "pipeline_role_grants" {
  role        = postgresql_role.pipeline_role.name
  database    = postgresql_database.pipeline_db.name
  schema      = "public"
  object_type = "schema"
  privileges  = ["ALL"]
}

resource "postgresql_extension" "timescaledb_extension" {
  name = "timescaledb"
  schema = "public"
  database = postgresql_database.pipeline_db.name
}

