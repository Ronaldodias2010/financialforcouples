# Configuração do provedor GCP
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Backend GCS para armazenar o estado do Terraform
  backend "gcs" {
    bucket = "couplesfinancials-terraform-state"
    prefix = "terraform/state"
  }
}

# Configuração do provedor Google Cloud
provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region

  default_labels = {
    project     = "couples-financials"
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Habilitar APIs necessárias
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",           # Cloud Run
    "compute.googleapis.com",       # Load Balancer
    "artifactregistry.googleapis.com", # Artifact Registry
    "secretmanager.googleapis.com", # Secret Manager
    "cloudscheduler.googleapis.com", # Cloud Scheduler (opcional)
    "logging.googleapis.com",       # Cloud Logging
    "monitoring.googleapis.com",    # Cloud Monitoring
  ])

  service = each.key
  
  disable_on_destroy = false
}

# Service Account para Cloud Run
resource "google_service_account" "cloud_run" {
  account_id   = "${var.app_name}-run-sa"
  display_name = "Cloud Run Service Account"
  description  = "Service account for Cloud Run services"
}

# Permissões para a service account acessar secrets
resource "google_project_iam_member" "secret_accessor" {
  project = var.gcp_project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Permissões para logs
resource "google_project_iam_member" "log_writer" {
  project = var.gcp_project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Permitir que a Service Account do GitHub Actions use a Cloud Run SA
# Isso resolve o erro: Permission 'iam.serviceaccounts.actAs' denied
resource "google_service_account_iam_member" "github_actions_can_use_cloudrun_sa" {
  service_account_id = google_service_account.cloud_run.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:github-actions-sa@${var.gcp_project_id}.iam.gserviceaccount.com"
  
  depends_on = [
    google_service_account.cloud_run
  ]
}

# Dar permissão adicional ao GitHub Actions SA para impersonar
resource "google_project_iam_member" "github_actions_sa_user" {
  project = var.gcp_project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:github-actions-sa@${var.gcp_project_id}.iam.gserviceaccount.com"
}
