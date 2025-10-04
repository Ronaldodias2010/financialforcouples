# Secret Manager para credenciais sensíveis

# Secret: Supabase Anon Key
resource "google_secret_manager_secret" "supabase_anon_key" {
  secret_id = "supabase-anon-key"

  replication {
    auto {}
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

resource "google_secret_manager_secret_version" "supabase_anon_key" {
  secret      = google_secret_manager_secret.supabase_anon_key.id
  secret_data = var.supabase_anon_key
}

# Secret: Supabase Service Role Key
resource "google_secret_manager_secret" "supabase_service_role_key" {
  secret_id = "supabase-service-role-key"

  replication {
    auto {}
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

resource "google_secret_manager_secret_version" "supabase_service_role_key" {
  secret      = google_secret_manager_secret.supabase_service_role_key.id
  secret_data = var.supabase_service_role_key
}

# IAM: Service Account pode acessar os secrets
resource "google_secret_manager_secret_iam_member" "cloud_run_anon_access" {
  secret_id = google_secret_manager_secret.supabase_anon_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "cloud_run_service_access" {
  secret_id = google_secret_manager_secret.supabase_service_role_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}
