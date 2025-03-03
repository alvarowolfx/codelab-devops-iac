output "grafana_url" {
  value = "http://localhost:${docker_container.grafana.ports[0].external}"
}

output "redpanda_console_url" {
  value = "http://localhost:${docker_container.queue_console.ports[0].external}"
}