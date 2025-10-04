#!/bin/bash

# Script para inicializar o backend do Terraform no Google Cloud Storage
# Executar apenas UMA VEZ antes do primeiro terraform apply

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Inicialização do Backend do Terraform ===${NC}"

# Configurações
PROJECT_ID="${GCP_PROJECT_ID:-couplesfinancials}"
BUCKET_NAME="${PROJECT_ID}-terraform-state"
BUCKET_LOCATION="US"
REGION="us-central1"

echo -e "\n${YELLOW}Projeto GCP: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}Bucket: ${BUCKET_NAME}${NC}"
echo -e "${YELLOW}Região: ${REGION}${NC}"

# Verificar se gcloud está configurado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI não encontrado. Instale o Google Cloud SDK.${NC}"
    exit 1
fi

# Verificar autenticação
echo -e "\n${YELLOW}Verificando autenticação...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${RED}❌ Não autenticado no GCP. Execute: gcloud auth login${NC}"
    exit 1
fi

# Configurar projeto
echo -e "\n${YELLOW}Configurando projeto...${NC}"
gcloud config set project ${PROJECT_ID}

# Verificar se bucket já existe
if gsutil ls -b gs://${BUCKET_NAME} &> /dev/null; then
    echo -e "${GREEN}✅ Bucket ${BUCKET_NAME} já existe${NC}"
else
    echo -e "\n${YELLOW}Criando bucket para Terraform state...${NC}"
    gsutil mb -p ${PROJECT_ID} -l ${BUCKET_LOCATION} gs://${BUCKET_NAME}
    echo -e "${GREEN}✅ Bucket criado${NC}"
fi

# Habilitar versionamento
echo -e "\n${YELLOW}Habilitando versionamento do bucket...${NC}"
gsutil versioning set on gs://${BUCKET_NAME}
echo -e "${GREEN}✅ Versionamento habilitado${NC}"

# Configurar lifecycle (manter últimas 5 versões)
echo -e "\n${YELLOW}Configurando lifecycle policy...${NC}"
cat > /tmp/lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "numNewerVersions": 5
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set /tmp/lifecycle.json gs://${BUCKET_NAME}
rm /tmp/lifecycle.json
echo -e "${GREEN}✅ Lifecycle policy configurada${NC}"

# Configurar labels
echo -e "\n${YELLOW}Configurando labels...${NC}"
gsutil label ch -l environment:prod gs://${BUCKET_NAME}
gsutil label ch -l managed_by:terraform gs://${BUCKET_NAME}
gsutil label ch -l purpose:terraform-state gs://${BUCKET_NAME}
echo -e "${GREEN}✅ Labels configuradas${NC}"

# Verificar configuração
echo -e "\n${YELLOW}Verificando configuração final...${NC}"
gsutil ls -L -b gs://${BUCKET_NAME}

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Backend do Terraform inicializado!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Próximos passos:${NC}"
echo -e "1. Configure os secrets no GitHub Actions"
echo -e "2. Faça push do código para a branch main"
echo -e "3. O workflow do Terraform será executado automaticamente"
echo -e "\n${YELLOW}Para executar localmente:${NC}"
echo -e "cd terraform-gcp"
echo -e "terraform init"
echo -e "terraform plan"
echo -e "terraform apply"
