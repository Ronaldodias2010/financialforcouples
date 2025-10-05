#!/bin/bash

# Script para adicionar permissões necessárias à Service Account do GitHub Actions
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== Configurando Permissões do Terraform ===${NC}"

PROJECT_ID="${GCP_PROJECT_ID:-couples-financials-446721}"
SA_NAME="github-actions-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo -e "\n${YELLOW}Projeto: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}Service Account: ${SA_EMAIL}${NC}"

# Verificar autenticação
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${RED}❌ Não autenticado no GCP${NC}"
    echo -e "${YELLOW}Execute: gcloud auth login${NC}"
    exit 1
fi

# Configurar projeto
gcloud config set project ${PROJECT_ID}

echo -e "\n${BLUE}Habilitando APIs necessárias...${NC}"

# Habilitar Cloud Resource Manager API primeiro
gcloud services enable cloudresourcemanager.googleapis.com --project=${PROJECT_ID}

# Habilitar outras APIs necessárias
APIS=(
  "compute.googleapis.com"
  "serviceusage.googleapis.com"
  "iam.googleapis.com"
  "secretmanager.googleapis.com"
)

for API in "${APIS[@]}"; do
  echo -e "${YELLOW}Habilitando ${API}...${NC}"
  gcloud services enable ${API} --project=${PROJECT_ID} || echo "API já habilitada"
done

echo -e "\n${BLUE}Adicionando roles necessários à Service Account...${NC}"

# Roles necessários para o Terraform funcionar
ROLES=(
  "roles/compute.admin"                    # Para criar Load Balancers e IPs
  "roles/iam.serviceAccountAdmin"          # Para criar Service Accounts
  "roles/iam.serviceAccountUser"           # Para usar Service Accounts
  "roles/secretmanager.admin"              # Para criar Secrets
  "roles/serviceusage.serviceUsageAdmin"   # Para habilitar APIs
  "roles/resourcemanager.projectIamAdmin"  # Para modificar IAM do projeto
)

for ROLE in "${ROLES[@]}"; do
  echo -e "${YELLOW}Adicionando role: ${ROLE}${NC}"
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --condition=None \
    || echo "Role já existe ou erro ao adicionar"
done

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Permissões configuradas com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${BLUE}Próximos passos:${NC}"
echo -e "1. Aguarde 1-2 minutos para as permissões propagarem"
echo -e "2. Re-execute o workflow do GitHub Actions"
echo -e "3. O Terraform deve criar o Load Balancer e IP agora"
echo -e "\n${YELLOW}Nota: O Cloud Run já está funcionando, você pode acessá-lo pela URL:${NC}"
echo -e "${BLUE}https://couples-financials-xozk62fcea-uc.a.run.app${NC}"
