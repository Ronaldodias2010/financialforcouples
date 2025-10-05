# Secret Manager para credenciais sensíveis
# Apenas referencia secrets existentes criados pelo script setup-gcp-secrets.sh
# As permissões IAM são gerenciadas manualmente pelo script

data "google_secret_manager_secret" "supabase_anon_key" {
  secret_id = "supabase-anon-key"
  project   = var.gcp_project_id
}

data "google_secret_manager_secret" "supabase_service_role_key" {
  secret_id = "supabase-service-role-key"
  project   = var.gcp_project_id
}
