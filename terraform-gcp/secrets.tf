# Secret Manager para credenciais sensíveis
# Use data sources to reference existing secrets instead of creating new ones

data "google_secret_manager_secret" "supabase_anon_key" {
  secret_id = "supabase-anon-key"
  project   = var.gcp_project_id
}

data "google_secret_manager_secret" "supabase_service_role_key" {
  secret_id = "supabase-service-role-key"
  project   = var.gcp_project_id
}

# IAM: Service Accounts podem acessar os secrets

# Cloud Run SA access
resource "google_secret_manager_secret_iam_member" "cloud_run_anon_access" {
  secret_id = data.google_secret_manager_secret.supabase_anon_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "cloud_run_service_access" {
  secret_id = data.google_secret_manager_secret.supabase_service_role_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

# GitHub Actions SA access to secret versions
resource "google_secret_manager_secret_iam_member" "github_actions_anon_access" {
  secret_id = data.google_secret_manager_secret.supabase_anon_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:github-actions-sa@${var.gcp_project_id}.iam.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "github_actions_service_access" {
  secret_id = data.google_secret_manager_secret.supabase_service_role_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:github-actions-sa@${var.gcp_project_id}.iam.gserviceaccount.com"
}
