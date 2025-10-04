# Terraform para Google Cloud Platform (GCP)

Este diretório contém a configuração Terraform para fazer deploy da aplicação Couples Financials no Google Cloud Platform.

## 📋 Pré-requisitos

1. **Conta GCP** com billing habilitado
2. **Terraform** instalado (>= 1.0)
3. **gcloud CLI** instalado e configurado
4. **Projeto GCP** criado

## 🚀 Setup Inicial

### 1. Instalar gcloud CLI

```bash
# Ubuntu/Debian
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# macOS
brew install --cask google-cloud-sdk
gcloud init
```

### 2. Criar Projeto GCP

```bash
# Criar projeto
gcloud projects create couples-financials-prod --name="Couples Financials"

# Configurar projeto ativo
gcloud config set project couples-financials-prod

# Habilitar billing (necessário para todos os serviços)
# Faça isso no console: https://console.cloud.google.com/billing
```

### 3. Autenticar Terraform

```bash
# Autenticar com Application Default Credentials
gcloud auth application-default login

# Ou criar service account para Terraform
gcloud iam service-accounts create terraform-sa \
  --display-name="Terraform Service Account"

gcloud projects add-iam-policy-binding couples-financials-prod \
  --member="serviceAccount:terraform-sa@couples-financials-prod.iam.gserviceaccount.com" \
  --role="roles/editor"
```

### 4. Criar Artifact Registry

```bash
# Criar repositório para imagens Docker
gcloud artifacts repositories create couples-financials \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for Couples Financials"

# Configurar Docker para usar o Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## 📦 Deploy com Terraform

### 1. Configurar Variáveis

```bash
# Copiar exemplo de variáveis
cp terraform.tfvars.example terraform.tfvars

# Editar com suas configurações
nano terraform.tfvars
```

### 2. Inicializar Terraform

```bash
terraform init
```

### 3. Planejar Deploy

```bash
terraform plan
```

### 4. Aplicar Infraestrutura

```bash
terraform apply
```

### 5. Ver Outputs

```bash
terraform output
```

## 🏗️ Arquitetura Criada

- **Cloud Run**: Service serverless para a aplicação
- **Cloud Load Balancer**: Load balancer HTTPS global
- **Cloud CDN**: CDN integrado para performance global
- **Cloud Storage**: Bucket para assets estáticos
- **Secret Manager**: Armazenamento seguro de credenciais
- **Artifact Registry**: Registro de imagens Docker
- **IAM & Service Accounts**: Permissões e segurança

## 🔄 Atualizar Aplicação

### Build e Push da Imagem

```bash
# Build da imagem
docker build -t us-central1-docker.pkg.dev/SEU_PROJECT_ID/couples-financials/app:latest .

# Push para Artifact Registry
docker push us-central1-docker.pkg.dev/SEU_PROJECT_ID/couples-financials/app:latest

# Atualizar Cloud Run
gcloud run services update couples-financials \
  --region=us-central1 \
  --image=us-central1-docker.pkg.dev/SEU_PROJECT_ID/couples-financials/app:latest
```

### Ou usar Terraform

```bash
# Atualizar variável container_image no terraform.tfvars
terraform apply
```

## 🌐 Configurar DNS

Após o deploy, você receberá um IP estático. Configure seus registros DNS:

```
Tipo: A
Nome: @
Valor: [IP do output load_balancer_ip]
TTL: 300

Tipo: A
Nome: www
Valor: [IP do output load_balancer_ip]
TTL: 300
```

O certificado SSL será provisionado automaticamente após o DNS propagar.

## 💰 Custos Estimados

### Cloud Run (Pay-per-use)
- **CPU**: $0.00002400/vCPU-second
- **Memory**: $0.00000250/GiB-second
- **Requests**: $0.40/million
- **Free tier**: 2 milhões requests/mês

### Cloud Load Balancer
- **Forwarding rules**: $0.025/hora (~$18/mês)
- **Data processed**: $0.008-$0.012/GB

### Cloud CDN
- **Cache fills**: $0.02-$0.04/GB
- **Cache egress**: $0.04-$0.15/GB

### Cloud Storage
- **Standard storage**: $0.020/GB/mês
- **Network egress**: $0.12/GB (após 1GB free)

### Artifact Registry
- **Storage**: $0.10/GB/mês
- **Free tier**: 0.5 GB

**Estimativa total mensal**: $30-$80 (dependendo do tráfego)

**Economia vs AWS**: ~40-50% de redução de custos

## 📊 Monitoramento

```bash
# Ver logs do Cloud Run
gcloud run services logs read couples-financials --region=us-central1

# Ver métricas
gcloud monitoring dashboards list

# Ver status do serviço
gcloud run services describe couples-financials --region=us-central1
```

## 🔒 Segurança

- ✅ HTTPS forçado
- ✅ Secrets no Secret Manager
- ✅ IAM com least privilege
- ✅ Service accounts dedicadas
- ✅ Certificados SSL gerenciados
- ✅ CORS configurado

## 🧹 Destruir Infraestrutura

```bash
# CUIDADO: Isso remove TODOS os recursos
terraform destroy
```

## 📚 Recursos Úteis

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Artifact Registry Guide](https://cloud.google.com/artifact-registry/docs)
- [Cloud CDN Documentation](https://cloud.google.com/cdn/docs)

## 🆘 Troubleshooting

### Erro: "Project not found"
```bash
gcloud config set project SEU_PROJECT_ID
```

### Erro: "Billing not enabled"
- Habilite billing no console: https://console.cloud.google.com/billing

### Erro: "Permission denied"
```bash
gcloud auth application-default login
```

### SSL Certificate não provisiona
- Verifique se o DNS está apontando corretamente
- Pode levar até 24 horas para provisionar
- Use: `terraform output ssl_certificate_status`
