# Variáveis de configuração para Terraform no GCP

variable "gcp_project_id" {
  description = "ID do projeto GCP"
  type        = string
}

variable "gcp_region" {
  description = "Região do GCP onde os recursos serão criados"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Ambiente de deploy (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Nome da aplicação"
  type        = string
  default     = "couples-financials"
}

variable "domain_name" {
  description = "Nome do domínio para a aplicação"
  type        = string
  default     = ""
}

variable "secondary_domain_name" {
  description = "Nome do domínio secundário para a aplicação"
  type        = string
  default     = ""
}

variable "supabase_url" {
  description = "URL do Supabase"
  type        = string
  default     = "https://elxttabdtddlavhseipz.supabase.co"
}

variable "supabase_anon_key" {
  description = "Chave anônima do Supabase"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Chave do service role do Supabase"
  type        = string
  sensitive   = true
}

variable "container_image" {
  description = "Imagem do container no Artifact Registry"
  type        = string
  default     = "us-central1-docker.pkg.dev/PROJECT_ID/couples-financials/app:latest"
}

variable "min_instances" {
  description = "Número mínimo de instâncias do Cloud Run (0 = escala para zero)"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Número máximo de instâncias do Cloud Run"
  type        = number
  default     = 10
}

variable "cpu" {
  description = "CPU por instância (ex: 1, 2, 4)"
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Memória por instância (ex: 512Mi, 1Gi, 2Gi)"
  type        = string
  default     = "512Mi"
}

variable "max_requests_per_container" {
  description = "Máximo de requisições simultâneas por container"
  type        = number
  default     = 80
}

variable "enable_cdn" {
  description = "Habilitar Cloud CDN para distribuição global"
  type        = bool
  default     = true
}

variable "cdn_cache_max_age" {
  description = "Tempo máximo de cache no CDN (em segundos)"
  type        = number
  default     = 3600
}

variable "artifact_registry_location" {
  description = "Localização do Artifact Registry"
  type        = string
  default     = "us-central1"
}
