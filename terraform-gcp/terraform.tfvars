# Terraform Variables - NÃO COMMITAR ESTE ARQUIVO
# Este arquivo é gerado automaticamente pelo GitHub Actions
# Para execução local, exporte as variáveis de ambiente necessárias

# ATENÇÃO: Este arquivo contém informações sensíveis
# Ele está incluído no .gitignore para evitar commits acidentais

# Projeto GCP
gcp_project_id = "couplesfinancials"
gcp_region = "us-central1"

# Ambiente
environment = "prod"

# Nome da aplicação
app_name = "couples-financials"

# Domínios
domain_name = "couplesfinancials.com"
secondary_domain_name = "couplesfin.com"

# Supabase (usar secrets do GitHub Actions)
supabase_url = "${SUPABASE_URL}"
supabase_anon_key = "${SUPABASE_ANON_KEY}"
supabase_service_role_key = "${SUPABASE_SERVICE_ROLE_KEY}"

# Container Image
container_image = "us-central1-docker.pkg.dev/couplesfinancials/couples-financials/app:latest"

# Configurações de escala do Cloud Run
min_instances = 0  # 0 = escala para zero quando não há tráfego
max_instances = 10

# Recursos por instância
cpu = "1"      # 1, 2 ou 4 vCPUs
memory = "512Mi"  # 512Mi, 1Gi, 2Gi, 4Gi

# Concorrência
max_requests_per_container = 80

# Cloud CDN
enable_cdn = true
cdn_cache_max_age = 3600  # 1 hora em segundos

# Artifact Registry
artifact_registry_location = "us-central1"
