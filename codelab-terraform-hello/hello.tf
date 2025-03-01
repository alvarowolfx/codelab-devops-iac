
# Pull the latest caddy image
resource "docker_image" "proxy_image" {
  name         = "caddy:latest"
  keep_locally = false
}

variable "num_instances" {
  type    = number
  default = 8
}

resource "local_file" "page" {
  count = var.num_instances
  content = templatefile("${path.module}/hellopage.tftpl", {
    name = "caddy-${count.index}"
  })
  filename = "${path.cwd}/pages/index-${count.index}.html"
}

resource "local_file" "caddy_config" {
  content = templatefile("${path.module}/Caddyfile.tftpl", {
    servers = join(" ", [for i in range(var.num_instances) : "caddy-server-${i}:80"])
  })
  filename = "${path.cwd}/config/Caddyfile"
}

# Create a network for the caddy containers
resource "docker_network" "server_network" {
  name = "server_network"
}

# Create a caddy containers
resource "docker_container" "server" {
  count             = var.num_instances
  name              = "caddy-server-${count.index}"
  image             = docker_image.proxy_image.image_id
  publish_all_ports = true
  must_run          = true
  network_mode      = "bridge"
  networks_advanced {
    name = docker_network.server_network.name
  }
  log_opts = {
    "max-size" = "10m"
    "max-file" = "5"
  }
  ports {
    external = 8181 + count.index
    internal = 80
  }

  volumes {
    container_path = "/usr/share/caddy/index.html"
    host_path      = "${path.cwd}/pages/index-${count.index}.html"
  }
  volumes {
    container_path = "/data"
    host_path      = "${path.cwd}/caddy/data-${count.index}"
  }
}

# Create a load balancer container
resource "docker_container" "load_balancer" {
  name              = "caddy-load-balancer"
  image             = docker_image.proxy_image.image_id
  publish_all_ports = true
  must_run          = true
  network_mode      = "bridge"
  networks_advanced {
    name = docker_network.server_network.name
  }
  log_opts = {
    "max-size" = "10m"
    "max-file" = "5"
  }
  ports {
    external = 9090
    internal = 80
  }

  volumes {
    container_path = "/etc/caddy/Caddyfile"
    host_path      = "${path.cwd}/config/Caddyfile"
  }
  volumes {
    container_path = "/data"
    host_path      = "${path.cwd}/caddy/data-lb"
  }
}