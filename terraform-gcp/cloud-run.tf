# Cloud Run Service para a aplicação

resource "google_cloud_run_v2_service" "app" {
  name     = var.app_name
  location = var.gcp_region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.container_image

      # Recursos
      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
        cpu_idle = var.min_instances == 0 ? true : false
      }

      # Porta do container
      ports {
        container_port = 80
      }

      # Variáveis de ambiente
      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "SUPABASE_URL"
        value = var.supabase_url
      }

      # Secrets do Secret Manager
      env {
        name = "SUPABASE_ANON_KEY"
        value_source {
          secret_key_ref {
            secret  = data.google_secret_manager_secret.supabase_anon_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "SUPABASE_SERVICE_ROLE_KEY"
        value_source {
          secret_key_ref {
            secret  = data.google_secret_manager_secret.supabase_service_role_key.secret_id
            version = "latest"
          }
        }
      }

      # Health check
      startup_probe {
        initial_delay_seconds = 0
        timeout_seconds       = 1
        period_seconds        = 3
        failure_threshold     = 3
        http_get {
          path = "/"
        }
      }

      liveness_probe {
        http_get {
          path = "/"
        }
        initial_delay_seconds = 10
        period_seconds        = 10
        timeout_seconds       = 5
        failure_threshold     = 3
      }
    }

    # Configurações de concorrência
    max_instance_request_concurrency = var.max_requests_per_container

    # Timeout para requisições
    timeout = "300s"
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.required_apis,
    data.google_secret_manager_secret.supabase_anon_key,
    data.google_secret_manager_secret.supabase_service_role_key
  ]
}

# Permitir acesso público não autenticado ao Cloud Run
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_v2_service.app.name
  location = google_cloud_run_v2_service.app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Network Endpoint Group para conectar Cloud Run ao Load Balancer
resource "google_compute_region_network_endpoint_group" "serverless_neg" {
  name                  = "${var.app_name}-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.gcp_region

  cloud_run {
    service = google_cloud_run_v2_service.app.name
  }
}
