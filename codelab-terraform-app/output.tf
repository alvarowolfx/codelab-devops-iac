output "app_url" {
  value = "http://${docker_container.app.network_data[0].ip_address}:${docker_container.app.ports[0].external}"
}

output "db_url" {
  value = "postgresql://nocodb:${var.app_user_password}@${docker_container.db.network_data[0].ip_address}:${docker_container.db.ports[0].external}/nocodb"
}
