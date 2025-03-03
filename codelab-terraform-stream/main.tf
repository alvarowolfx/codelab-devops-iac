
terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "3.0.2"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "1.25.0"
    }
  }
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
  #host = "tcp://localhost:2375"
}

provider "postgresql" {
  host            = "localhost"
  port            = var.db_port
  database        = "postgres"
  username        = "postgres"
  password        = var.postgres_password
  sslmode         = "disable"
  connect_timeout = 15
}

resource "docker_network" "pipeline_network" {
  name = "pipeline_network"
}
