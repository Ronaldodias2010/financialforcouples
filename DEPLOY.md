# 🚀 Guia de Deploy - Couples Financials

Este guia orienta como configurar e fazer deploy da aplicação Couples Financials na AWS.

## 📋 Pré-requisitos

### Ferramentas necessárias:
- [AWS CLI](https://aws.amazon.com/cli/) configurado
- [Terraform](https://terraform.io/) versão 1.5+
- [Docker](https://docker.com/)
- [Node.js](https://nodejs.org/) versão 18+

### Permissões AWS necessárias:
- ECS (Elastic Container Service)
- ECR (Elastic Container Registry)
- ALB (Application Load Balancer)
- IAM (Identity and Access Management)
- CloudWatch Logs
- Secrets Manager
- CloudFront (opcional)

## 🔧 Configuração Inicial

### 1. Configure AWS CLI
```bash
aws configure
```
Forneça suas credenciais de acesso AWS.

### 2. Configure variáveis do Terraform
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edite `terraform.tfvars` com suas configurações:
```hcl
aws_region = "us-east-1"
app_name = "couples-financials"
supabase_url = "https://elxttabdtddlavhseipz.supabase.co"
supabase_anon_key = "sua_chave_aqui"
supabase_service_role_key = "sua_chave_aqui"
```

### 3. Configure secrets no GitHub (para CI/CD)
No repositório GitHub, vá em Settings > Secrets and Variables > Actions:

- `AWS_ACCESS_KEY_ID`: Sua chave de acesso AWS
- `AWS_SECRET_ACCESS_KEY`: Sua chave secreta AWS
- `SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave service role do Supabase

## 🚀 Deploy Manual

### Deploy completo
```bash
./scripts/deploy.sh
```

### Opções do script de deploy
```bash
# Deploy sem testes
./scripts/deploy.sh --skip-tests

# Deploy apenas da infraestrutura
./scripts/deploy.sh --infrastructure-only

# Deploy apenas da aplicação
./scripts/deploy.sh --app-only

# Pular build da aplicação
./scripts/deploy.sh --skip-build
```

## 🔄 Deploy Automático (CI/CD)

O deploy automático acontece quando você faz push para:
- `main` branch: Deploy para produção
- `production` branch: Deploy para produção

O workflow inclui:
1. Testes e validação
2. Build e push da imagem Docker
3. Deploy da infraestrutura com Terraform
4. Deploy da aplicação no ECS
5. Testes pós-deploy

## 🏗️ Infraestrutura

A aplicação é deployada usando:

### AWS ECS (Elastic Container Service)
- **Cluster**: `couples-financials-cluster`
- **Service**: `couples-financials`
- **Task Definition**: Container com a aplicação React

### Application Load Balancer (ALB)
- **DNS**: `couples-financials-alb-xxxxx.us-east-1.elb.amazonaws.com`
- **Health Check**: `/health`
- **Portas**: 80 (HTTP), 443 (HTTPS se domínio configurado)

### Amazon ECR (Container Registry)
- **Repository**: `couples-financials`
- **Images**: Tagged com timestamp e `latest`

### CloudWatch Logs
- **Log Group**: `/ecs/couples-financials`
- **Retention**: 7 dias (configurável)

### AWS Secrets Manager
- **Supabase Credentials**: Chaves de acesso ao Supabase
- **App Config**: Configurações da aplicação

## 🔍 Monitoramento

### Health Check
A aplicação expõe um endpoint de health check:
```
GET /health
```

### Logs
Visualize logs da aplicação:
```bash
aws logs tail /ecs/couples-financials --follow
```

### Status do serviço ECS
```bash
aws ecs describe-services \
  --cluster couples-financials-cluster \
  --services couples-financials
```

## 🌐 Domínio Personalizado (Opcional)

Para usar um domínio personalizado:

1. Configure o domínio no Route 53
2. Adicione `domain_name` no `terraform.tfvars`
3. Execute deploy novamente

O Terraform criará automaticamente:
- Certificado SSL via ACM
- Registros DNS no Route 53
- Listener HTTPS no ALB

## 🛠️ Troubleshooting

### Problemas comuns:

#### 1. Falha no build
```bash
# Limpe dependências e rebuilde
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 2. Falha no push ECR
```bash
# Re-login no ECR
aws ecr get-login-password --region us-east-1 | \
docker login --username AWS --password-stdin \
$(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
```

#### 3. Serviço ECS não estabiliza
```bash
# Verifique logs
aws logs tail /ecs/couples-financials --follow

# Force novo deployment
aws ecs update-service \
  --cluster couples-financials-cluster \
  --service couples-financials \
  --force-new-deployment
```

#### 4. Health check falha
- Verifique se a aplicação está rodando na porta 80
- Confirme que o endpoint `/health` existe
- Aguarde alguns minutos para inicialização

### Rollback
Para fazer rollback para versão anterior:
```bash
# Liste task definitions
aws ecs list-task-definitions --family-prefix couples-financials

# Deploy versão anterior
aws ecs update-service \
  --cluster couples-financials-cluster \
  --service couples-financials \
  --task-definition couples-financials:REVISION_NUMBER
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs do CloudWatch
2. Confirme configurações no `terraform.tfvars`
3. Valide credenciais AWS
4. Execute `terraform plan` para ver mudanças

## 🔒 Segurança

- Todas as chaves sensíveis são armazenadas no AWS Secrets Manager
- Container roda com usuário não-root
- ALB tem security groups restritivos
- Logs não contêm informações sensíveis

---

✅ **Deploy realizado com sucesso!** Sua aplicação estará disponível no URL do ALB.