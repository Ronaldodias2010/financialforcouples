# 🚀 Guia Rápido de Setup GCP

## ✅ Pré-requisitos

Antes de executar o script, certifique-se de ter instalado:

1. **Google Cloud SDK (gcloud)**
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Linux
   curl https://sdk.cloud.google.com | bash
   
   # Ou baixe em: https://cloud.google.com/sdk/docs/install
   ```

2. **Terraform**
   ```bash
   # macOS
   brew install terraform
   
   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   
   # Ou baixe em: https://www.terraform.io/downloads
   ```

3. **Docker**
   ```bash
   # macOS
   brew install docker
   
   # Ou baixe em: https://docs.docker.com/get-docker/
   ```

## 🎯 Passos 1 e 2 - Executar Setup Automático

### 1. Dar permissão de execução ao script
```bash
chmod +x scripts/setup-gcp.sh
```

### 2. Executar o script de setup
```bash
./scripts/setup-gcp.sh
```

### O que o script faz automaticamente:

✅ **Passo 1: Configuração gcloud**
- Autentica no GCP (se necessário)
- Configura o projeto `couplesfinancials` como ativo
- Verifica se billing está habilitado

✅ **Passo 2: Habilita APIs necessárias**
- Cloud Run API
- Compute Engine API
- Artifact Registry API
- Secret Manager API
- Cloud Scheduler API
- Logging API
- Monitoring API
- IAM API

✅ **Bonus: Cria infraestrutura base**
- Artifact Registry para imagens Docker
- Service Account para GitHub Actions
- Chave JSON para CI/CD (`gcp-key.json`)
- Secrets no Secret Manager (você precisará fornecer suas chaves Supabase)

## 📝 Durante a Execução

O script irá solicitar:

1. **SUPABASE_ANON_KEY**: Sua chave pública do Supabase
2. **SUPABASE_SERVICE_ROLE_KEY**: Sua chave privada do Supabase

💡 **Onde encontrar suas chaves Supabase:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: Settings > API
4. Copie as chaves:
   - `anon` `public` - para SUPABASE_ANON_KEY
   - `service_role` `secret` - para SUPABASE_SERVICE_ROLE_KEY

## 🎉 Após a Execução

O script criará um arquivo `gcp-key.json` com as credenciais da service account.

### Próximos Passos:

1. **Configurar GitHub Secrets** (veja abaixo)
2. **Configurar Terraform** (Passo 3)
3. **Fazer deploy** (Passo 4)

---

## 🔐 Configurar GitHub Secrets

Após executar o script, configure os seguintes secrets no GitHub:

1. Vá no seu repositório GitHub
2. Settings > Secrets and variables > Actions
3. Clique em "New repository secret"

Adicione os seguintes secrets:

### `GCP_PROJECT_ID`
```
couplesfinancials
```

### `GCP_SERVICE_ACCOUNT_KEY`
Cole todo o conteúdo do arquivo `gcp-key.json`:
```bash
cat gcp-key.json
```
Copie a saída completa (desde `{` até `}`)

### `SUPABASE_URL`
```
https://elxttabdtddlavhseipz.supabase.co
```

---

## 🏗️ Próximos Passos (Passo 3)

Depois de configurar os GitHub Secrets, você pode:

### Opção A: Deploy via Terraform
```bash
cd terraform-gcp
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Edite as chaves do Supabase

terraform init
terraform plan
terraform apply
```

### Opção B: Deploy manual
```bash
./scripts/deploy-gcp.sh
```

### Opção C: Push para GitHub (deploy automático)
```bash
git add .
git commit -m "Configure GCP deployment"
git push origin main
```

---

## 📊 Verificar Setup

Após executar o script, verifique no Console GCP:

- **Dashboard**: https://console.cloud.google.com/home/dashboard?project=couplesfinancials
- **APIs habilitadas**: https://console.cloud.google.com/apis/dashboard?project=couplesfinancials
- **Artifact Registry**: https://console.cloud.google.com/artifacts?project=couplesfinancials
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager?project=couplesfinancials
- **Service Accounts**: https://console.cloud.google.com/iam-admin/serviceaccounts?project=couplesfinancials

---

## ❓ Problemas Comuns

### "gcloud command not found"
Instale o Google Cloud SDK conforme instruções acima e execute:
```bash
gcloud init
```

### "Billing not enabled"
1. Acesse: https://console.cloud.google.com/billing/linkedaccount?project=couplesfinancials
2. Associe uma conta de billing ao projeto
3. Execute o script novamente

### "Permission denied"
Execute antes de rodar o script:
```bash
chmod +x scripts/setup-gcp.sh
```

### "Service account already exists"
O script detecta recursos existentes e não os recria. Continue normalmente.

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do script
2. Consulte a documentação GCP: https://cloud.google.com/docs
3. Verifique o arquivo `docs/MIGRATION-AWS-TO-GCP.md` para mais detalhes
