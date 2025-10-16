#!/bin/bash

# Script para corrigir certificado SSL que falhou
# Use quando o certificado estiver com status FAILED_NOT_VISIBLE

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="couples-financials"
PROJECT_ID="couplesfinancials"

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}  Correção de Certificado SSL${NC}"
echo -e "${BLUE}==================================================${NC}\n"

# Verificar autenticação
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" > /dev/null 2>&1; then
    echo -e "${RED}✗ Não autenticado no GCP. Execute: gcloud auth login${NC}"
    exit 1
fi

# Verificar status atual
echo -e "${YELLOW}[1/4] Verificando status atual do certificado...${NC}"
ssl_status=$(gcloud compute ssl-certificates describe ${APP_NAME}-ssl-cert --global --format="value(managed.status)" 2>/dev/null || echo "NAO_ENCONTRADO")

echo -e "  Status atual: ${YELLOW}$ssl_status${NC}\n"

if [ "$ssl_status" == "ACTIVE" ]; then
    echo -e "${GREEN}✓ Certificado já está ATIVO! Nada a fazer.${NC}"
    exit 0
fi

if [ "$ssl_status" == "PROVISIONING" ]; then
    echo -e "${YELLOW}⏳ Certificado está em PROVISIONAMENTO.${NC}"
    echo -e "${YELLOW}   Aguarde até 15 minutos após DNS propagar.${NC}"
    echo -e "\n${BLUE}Deseja forçar recriação mesmo assim? (s/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Ss]$ ]]; then
        echo -e "${GREEN}Operação cancelada.${NC}"
        exit 0
    fi
fi

# Deletar certificado atual
echo -e "\n${YELLOW}[2/4] Deletando certificado atual...${NC}"

if [ "$ssl_status" != "NAO_ENCONTRADO" ]; then
    if gcloud compute ssl-certificates delete ${APP_NAME}-ssl-cert --global --quiet 2>/dev/null; then
        echo -e "${GREEN}✓ Certificado deletado com sucesso${NC}"
    else
        echo -e "${RED}✗ Erro ao deletar certificado${NC}"
        echo -e "${YELLOW}  Isso pode acontecer se o certificado estiver em uso.${NC}"
        echo -e "${YELLOW}  Aguarde alguns minutos e tente novamente.${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}  Certificado não existe, pulando deleção...${NC}"
fi

# Aguardar propagação da deleção
echo -e "\n${YELLOW}[3/4] Aguardando propagação da deleção (30 segundos)...${NC}"
for i in {30..1}; do
    echo -ne "  $i segundos\r"
    sleep 1
done
echo -e "${GREEN}✓ Pronto para recriar${NC}"

# Recriar certificado via Terraform
echo -e "\n${YELLOW}[4/4] Recriando certificado via Terraform...${NC}"

if [ ! -d "terraform-gcp" ]; then
    echo -e "${RED}✗ Diretório terraform-gcp não encontrado${NC}"
    echo -e "${YELLOW}  Execute este script da raiz do projeto${NC}"
    exit 1
fi

cd terraform-gcp

# Verificar se terraform está inicializado
if [ ! -d ".terraform" ]; then
    echo -e "${BLUE}  Inicializando Terraform...${NC}"
    terraform init
fi

# Recriar apenas o certificado SSL
echo -e "${BLUE}  Aplicando configuração do certificado SSL...${NC}"
if terraform apply -target=google_compute_managed_ssl_certificate.default -auto-approve; then
    echo -e "${GREEN}✓ Certificado recriado com sucesso${NC}"
else
    echo -e "${RED}✗ Erro ao recriar certificado${NC}"
    exit 1
fi

cd ..

# Verificar novo status
echo -e "\n${YELLOW}Verificando novo status...${NC}"
sleep 5

new_status=$(gcloud compute ssl-certificates describe ${APP_NAME}-ssl-cert --global --format="value(managed.status)" 2>/dev/null || echo "ERRO")

echo -e "  Novo status: ${YELLOW}$new_status${NC}\n"

# Instruções finais
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PRÓXIMOS PASSOS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ "$new_status" == "PROVISIONING" ]; then
    echo -e "${GREEN}✓ Certificado em provisionamento!${NC}\n"
    echo -e "O Google levará até ${YELLOW}15 minutos${NC} para provisionar o certificado."
    echo -e "\n${YELLOW}Pré-requisitos para sucesso:${NC}"
    echo -e "  • DNS deve estar apontando para 34.107.231.152"
    echo -e "  • DNS deve estar propagado globalmente"
    echo -e "  • Portas 80 e 443 devem estar acessíveis"
    echo -e "\n${BLUE}Verificar progresso:${NC}"
    echo -e "  gcloud compute ssl-certificates describe ${APP_NAME}-ssl-cert --global --format='value(managed.status)'"
    echo -e "\n${BLUE}Monitorar em tempo real:${NC}"
    echo -e "  watch -n 30 'gcloud compute ssl-certificates describe ${APP_NAME}-ssl-cert --global --format=\"value(managed.status)\"'"
elif [ "$new_status" == "ACTIVE" ]; then
    echo -e "${GREEN}✓✓✓ Certificado ATIVO! Tudo funcionando! ✓✓✓${NC}\n"
    echo -e "Seus domínios agora devem funcionar com HTTPS:"
    echo -e "  • https://couplesfinancials.com"
    echo -e "  • https://couplesfin.com"
else
    echo -e "${YELLOW}⚠ Status inesperado: $new_status${NC}\n"
    echo -e "Execute o diagnóstico completo:"
    echo -e "  ./scripts/diagnose-dns-ssl.sh"
fi

echo -e "\n${GREEN}Correção concluída!${NC}\n"
