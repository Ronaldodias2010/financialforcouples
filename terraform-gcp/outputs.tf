# Outputs para informações importantes do deploy

output "cloud_run_url" {
  description = "URL do Cloud Run service"
  value       = google_cloud_run_v2_service.app.uri
}

output "load_balancer_ip" {
  description = "IP público do Load Balancer"
  value       = google_compute_global_address.default.address
}

output "application_url" {
  description = "URL principal da aplicação"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : google_cloud_run_v2_service.app.uri
}

output "storage_bucket_name" {
  description = "Nome do bucket de assets estáticos"
  value       = google_storage_bucket.static_assets.name
}

output "storage_bucket_url" {
  description = "URL do bucket de assets"
  value       = "https://storage.googleapis.com/${google_storage_bucket.static_assets.name}"
}

output "backup_bucket_name" {
  description = "Nome do bucket de backups"
  value       = google_storage_bucket.backups.name
}

output "service_account_email" {
  description = "Email da service account do Cloud Run"
  value       = google_service_account.cloud_run.email
}

output "artifact_registry_repository" {
  description = "Repositório do Artifact Registry para imagens Docker"
  value       = "${var.artifact_registry_location}-docker.pkg.dev/${var.gcp_project_id}/${var.app_name}"
}

output "ssl_certificate_status" {
  description = "Status do certificado SSL gerenciado"
  value       = var.domain_name != "" ? google_compute_managed_ssl_certificate.default[0].managed[0].status : "N/A - No domain configured"
}

# Outputs para DNS
output "dns_records" {
  description = "Registros DNS necessários"
  value = {
    primary_domain = {
      type  = "A"
      name  = var.domain_name
      value = google_compute_global_address.default.address
    }
    secondary_domain = var.secondary_domain_name != "" ? {
      type  = "A"
      name  = var.secondary_domain_name
      value = google_compute_global_address.default.address
    } : null
  }
}

# Outputs para debugging
output "project_id" {
  description = "ID do projeto GCP"
  value       = var.gcp_project_id
}

output "region" {
  description = "Região do GCP"
  value       = var.gcp_region
}

output "environment" {
  description = "Ambiente de deploy"
  value       = var.environment
}

# Comandos úteis
output "useful_commands" {
  description = "Comandos úteis para gerenciar a aplicação"
  value = {
    view_logs         = "gcloud run services logs read ${var.app_name} --region=${var.gcp_region}"
    view_service      = "gcloud run services describe ${var.app_name} --region=${var.gcp_region}"
    deploy_new_image  = "gcloud run services update ${var.app_name} --region=${var.gcp_region} --image=${var.container_image}"
    view_cdn_cache    = "gcloud compute backend-services get-health ${var.app_name}-backend --global"
    invalidate_cache  = "gcloud compute url-maps invalidate-cdn-cache ${var.app_name}-url-map --path='/*'"
  }
}
