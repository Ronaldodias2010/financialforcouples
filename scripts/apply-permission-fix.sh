#!/bin/bash

# Script para aplicar correção de permissões via Terraform
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Aplicando Correção de Permissões ===${NC}"

PROJECT_ID="${GCP_PROJECT_ID:-couplesfinancials}"

echo -e "\n${YELLOW}Projeto: ${PROJECT_ID}${NC}"

# Verificar autenticação
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${RED}❌ Não autenticado no GCP${NC}"
    echo -e "${YELLOW}Execute: gcloud auth application-default login${NC}"
    exit 1
fi

# Configurar projeto
gcloud config set project ${PROJECT_ID}

# Navegar para terraform-gcp
cd terraform-gcp

echo -e "\n${YELLOW}Executando Terraform...${NC}"

# Init (caso não tenha feito ainda)
terraform init

# Plan para ver as mudanças
echo -e "\n${YELLOW}Mudanças que serão aplicadas:${NC}"
terraform plan -target=google_service_account_iam_member.github_actions_can_use_cloudrun_sa

# Aplicar apenas o recurso de permissão
echo -e "\n${YELLOW}Aplicando correção...${NC}"
terraform apply -target=google_service_account_iam_member.github_actions_can_use_cloudrun_sa -auto-approve

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Permissão aplicada com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Próximos passos:${NC}"
echo -e "1. Faça um novo push para o GitHub"
echo -e "2. Ou re-execute o workflow manualmente"
echo -e "\nO deploy deve funcionar agora! 🚀"
