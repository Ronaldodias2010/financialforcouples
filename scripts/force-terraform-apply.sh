#!/bin/bash

# Script para forçar aplicação completa do Terraform
# Use quando a infraestrutura precisa ser recriada

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}  Terraform Force Apply - Infraestrutura Completa${NC}"
echo -e "${BLUE}==================================================${NC}\n"

# Verificar diretório
if [ ! -d "terraform-gcp" ]; then
    echo -e "${RED}✗ Execute este script da raiz do projeto${NC}"
    exit 1
fi

# Verificar autenticação GCP
echo -e "${YELLOW}[1/6] Verificando autenticação GCP...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" > /dev/null 2>&1; then
    echo -e "${RED}✗ Não autenticado. Execute: gcloud auth login${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Autenticado${NC}\n"

# Verificar variáveis de ambiente
echo -e "${YELLOW}[2/6] Verificando variáveis de ambiente...${NC}"

required_vars=("SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "${RED}✗ Variáveis faltando: ${missing_vars[*]}${NC}"
    echo -e "${YELLOW}  Configure as variáveis antes de continuar${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Todas as variáveis configuradas${NC}\n"

cd terraform-gcp

# Terraform Init
echo -e "${YELLOW}[3/6] Inicializando Terraform...${NC}"
if terraform init -upgrade; then
    echo -e "${GREEN}✓ Terraform inicializado${NC}\n"
else
    echo -e "${RED}✗ Erro ao inicializar Terraform${NC}"
    exit 1
fi

# Terraform Validate
echo -e "${YELLOW}[4/6] Validando configuração...${NC}"
if terraform validate; then
    echo -e "${GREEN}✓ Configuração válida${NC}\n"
else
    echo -e "${RED}✗ Configuração inválida${NC}"
    exit 1
fi

# Terraform Plan
echo -e "${YELLOW}[5/6] Gerando plano de execução...${NC}"
if terraform plan -out=tfplan; then
    echo -e "${GREEN}✓ Plano gerado com sucesso${NC}\n"
else
    echo -e "${RED}✗ Erro ao gerar plano${NC}"
    exit 1
fi

# Confirmação
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  ATENÇÃO: Você está prestes a aplicar mudanças na infraestrutura${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "Recursos que serão criados/atualizados:"
echo -e "  • Load Balancer Global com IP estático"
echo -e "  • Certificado SSL gerenciado para domínios"
echo -e "  • Backend Service conectado ao Cloud Run"
echo -e "  • Forwarding Rules (HTTP e HTTPS)"
echo -e "  • Cloud CDN (se habilitado)"
echo -e "\n${RED}Deseja continuar? (s/N)${NC} "

read -r response
if [[ ! "$response" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada.${NC}"
    rm -f tfplan
    exit 0
fi

# Terraform Apply
echo -e "\n${YELLOW}[6/6] Aplicando infraestrutura...${NC}\n"

if terraform apply tfplan; then
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓✓✓ INFRAESTRUTURA APLICADA COM SUCESSO! ✓✓✓${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    # Capturar outputs
    echo -e "${BLUE}Informações da infraestrutura:${NC}\n"
    terraform output -json > ../terraform-outputs.json
    
    load_balancer_ip=$(terraform output -raw load_balancer_ip 2>/dev/null || echo "N/A")
    cloud_run_url=$(terraform output -raw cloud_run_url 2>/dev/null || echo "N/A")
    ssl_cert_id=$(terraform output -raw ssl_certificate_id 2>/dev/null || echo "N/A")
    
    echo -e "${GREEN}Load Balancer IP:${NC} $load_balancer_ip"
    echo -e "${GREEN}Cloud Run URL:${NC} $cloud_run_url"
    echo -e "${GREEN}SSL Certificate:${NC} $ssl_cert_id"
    
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}PRÓXIMOS PASSOS${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    echo -e "${YELLOW}1. Configurar DNS no seu provedor:${NC}"
    echo -e "   Type: A"
    echo -e "   Name: @ (para couplesfinancials.com)"
    echo -e "   Value: ${GREEN}$load_balancer_ip${NC}"
    echo -e "   TTL: 600"
    echo -e "\n   Repita para couplesfin.com\n"
    
    echo -e "${YELLOW}2. Aguardar propagação DNS (use dnschecker.org)${NC}\n"
    
    echo -e "${YELLOW}3. Aguardar provisionamento SSL (até 15 minutos)${NC}"
    echo -e "   Verificar status: ${BLUE}gcloud compute ssl-certificates list${NC}\n"
    
    echo -e "${YELLOW}4. Executar diagnóstico completo:${NC}"
    echo -e "   ${BLUE}./scripts/diagnose-dns-ssl.sh${NC}\n"
    
    echo -e "${GREEN}Outputs salvos em: terraform-outputs.json${NC}\n"
    
else
    echo -e "\n${RED}✗ Erro ao aplicar infraestrutura${NC}"
    rm -f tfplan
    exit 1
fi

# Limpar plano
rm -f tfplan

cd ..

echo -e "${GREEN}Processo concluído!${NC}\n"
