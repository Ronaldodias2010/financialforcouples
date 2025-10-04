#!/bin/bash

# Script para executar Terraform localmente (caso necessário)
# Normalmente o Terraform é executado via GitHub Actions

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Execução Local do Terraform ===${NC}"

# Verificar se está no diretório correto
if [ ! -f "terraform-gcp/main.tf" ]; then
    echo -e "${RED}❌ Execute este script da raiz do projeto${NC}"
    exit 1
fi

# Verificar variáveis necessárias
REQUIRED_VARS=(
    "GCP_PROJECT_ID"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

echo -e "\n${YELLOW}Verificando variáveis de ambiente...${NC}"
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Variável $var não definida${NC}"
        echo -e "${YELLOW}Export as variáveis necessárias ou use o GitHub Actions${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ $var definida${NC}"
    fi
done

# Verificar autenticação GCP
echo -e "\n${YELLOW}Verificando autenticação GCP...${NC}"
if ! gcloud auth application-default print-access-token &> /dev/null; then
    echo -e "${RED}❌ Não autenticado. Execute:${NC}"
    echo -e "gcloud auth application-default login"
    exit 1
fi
echo -e "${GREEN}✅ Autenticado${NC}"

# Criar arquivo terraform.tfvars temporário
echo -e "\n${YELLOW}Criando terraform.tfvars temporário...${NC}"
cat > terraform-gcp/terraform.tfvars <<EOF
# Gerado automaticamente - NÃO COMMITAR
gcp_project_id = "${GCP_PROJECT_ID}"
gcp_region = "us-central1"
environment = "prod"
app_name = "couples-financials"

domain_name = "${TF_VAR_domain_name:-couplesfinancials.com}"
secondary_domain_name = "${TF_VAR_secondary_domain_name:-couplesfin.com}"

supabase_url = "${SUPABASE_URL}"
supabase_anon_key = "${SUPABASE_ANON_KEY}"
supabase_service_role_key = "${SUPABASE_SERVICE_ROLE_KEY}"

container_image = "us-central1-docker.pkg.dev/${GCP_PROJECT_ID}/couples-financials/app:latest"

min_instances = 0
max_instances = 10
cpu = "1"
memory = "512Mi"
max_requests_per_container = 80

enable_cdn = true
cdn_cache_max_age = 3600

artifact_registry_location = "us-central1"
EOF
echo -e "${GREEN}✅ terraform.tfvars criado${NC}"

# Navegar para diretório do Terraform
cd terraform-gcp

# Executar Terraform
echo -e "\n${YELLOW}Inicializando Terraform...${NC}"
terraform init

echo -e "\n${YELLOW}Validando configuração...${NC}"
terraform validate

echo -e "\n${BLUE}=== TERRAFORM PLAN ===${NC}"
terraform plan -out=tfplan

echo -e "\n${YELLOW}Deseja aplicar estas mudanças? (yes/no)${NC}"
read -r response
if [ "$response" != "yes" ]; then
    echo -e "${RED}Cancelado pelo usuário${NC}"
    rm -f tfplan
    rm -f terraform.tfvars
    exit 1
fi

echo -e "\n${BLUE}=== TERRAFORM APPLY ===${NC}"
terraform apply tfplan

# Capturar outputs
echo -e "\n${GREEN}=== OUTPUTS ===${NC}"
terraform output -json > ../terraform-outputs.json
terraform output

# Cleanup
rm -f tfplan
rm -f terraform.tfvars

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Terraform aplicado com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Próximos passos:${NC}"
echo -e "1. Configure os DNS A records com o IP do Load Balancer"
echo -e "2. Aguarde propagação DNS (até 48h, geralmente 15-30 min)"
echo -e "3. Aguarde provisionamento do certificado SSL (até 15 min)"
echo -e "4. Faça deploy da aplicação com: ./scripts/deploy-gcp.sh"
echo -e "\n${YELLOW}Outputs salvos em: terraform-outputs.json${NC}"
