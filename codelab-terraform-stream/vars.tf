variable "db_port" {
  type    = number
  default = 5432
}

variable "postgres_password" {
  type    = string
  default = "supersecret"
}

variable "pipeline_user_password" {
  type    = string
  default = "anothersecret"
}

variable "bento_version" {
  type    = string
  default = "latest"
}

variable "timescaledb_version" {
  type    = string
  default = "latest-pg15"
}

variable "redpanda_version" {
  type    = string
  default = "latest"
}

variable "grafana_version" {
  type    = string
  default = "latest"
}
