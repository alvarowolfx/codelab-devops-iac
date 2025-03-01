variable "db_port" {
  type    = number
  default = 5432
}

variable "postgres_password" {
  type    = string
  default = "supersecret"
}

variable "app_user_password" {
  type    = string
  default = "anothersecret"
}

variable "app_version" {
  type    = string
  default = "latest"
}

variable "db_version" {
  type    = string
  default = "latest"
}