terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.8.0"
    }
  }
}

provider "google" {
  project = "mba-devops-colab"
  region  = "us-central1"
  zone    = "us-central1-c"
}

resource "google_compute_instance" "vm_instance" {
  for_each     = toset(var.student_set)
  name         = "${each.value}-vm"
  machine_type = "f1-micro"
  zone         = "us-central1-c"

  boot_disk {
    auto_delete = true
    mode        = "READ_WRITE"
    initialize_params {
      image = "projects/ubuntu-os-cloud/global/images/ubuntu-2410-oracular-amd64-v20250213"
      size  = 10
      type  = "pd-balanced"
    }
  }

  tags = ["http-server", "https-server", "student-${each.value}"]

  network_interface {
    network = "default"
    access_config {}
  }
}
