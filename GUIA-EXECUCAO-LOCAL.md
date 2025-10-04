# 🚀 Guia de Execução Local - Setup GCP

## Pré-requisitos (Instalar antes de começar)

### 1. Instalar Google Cloud SDK
```bash
# macOS (com Homebrew)
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Windows
# Baixe o instalador em: https://cloud.google.com/sdk/docs/install
```

### 2. Instalar Terraform (opcional para este passo)
```bash
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### 3. Instalar Docker (opcional para este passo)
```bash
# macOS
brew install docker

# Windows
# Baixe Docker Desktop em: https://docs.docker.com/desktop/install/windows-install/

# Linux
# Siga: https://docs.docker.com/engine/install/
```

---

## 📋 OPÇÃO 1: Executar o Script Completo (Recomendado)

### **Para Windows (Git Bash):**

### Passo 1: Baixar o projeto
Siga as instruções do arquivo `COMO-BAIXAR-PROJETO.md` para clonar o repositório.

### Passo 2: Abrir Git Bash na pasta do projeto
1. Abra o **Explorador de Arquivos**
2. Navegue até a pasta do projeto (exemplo: `C:\Users\SeuUsuario\Documents\couples-financials`)
3. **Clique com botão direito** dentro da pasta
4. Selecione **"Git Bash Here"**

### Passo 3: Executar o script
```bash
./scripts/setup-gcp.sh
```

---

### **Para macOS/Linux:**

### Passo 1: Abrir Terminal no diretório do projeto
```bash
cd /caminho/para/seu/projeto
```

### Passo 2: Dar permissão de execução
```bash
chmod +x scripts/setup-gcp.sh
```

### Passo 3: Executar o script
```bash
./scripts/setup-gcp.sh
```

### Durante a execução, o script vai:
1. ✅ Pedir para você fazer login no GCP (abrirá o navegador)
2. ✅ Configurar o projeto `couplesfinancials`
3. ✅ Verificar billing
4. ✅ Habilitar todas as APIs necessárias
5. ✅ Criar Artifact Registry
6. ✅ Configurar Docker
7. ✅ Criar Service Account para GitHub Actions
8. ✅ Gerar arquivo `gcp-key.json`
9. ✅ Pedir suas chaves do Supabase para criar secrets

### O que você vai precisar fornecer:
- **SUPABASE_ANON_KEY**: Copie de https://supabase.com/dashboard/project/elxttabdtddlavhseipz/settings/api
- **SUPABASE_SERVICE_ROLE_KEY**: Copie da mesma página (é a chave secreta)

---

## 📋 OPÇÃO 2: Executar Comandos Manualmente

Se preferir executar passo a passo:

### 1️⃣ Autenticar no GCP
```bash
gcloud auth login
```

### 2️⃣ Configurar o projeto
```bash
gcloud config set project couplesfinancials
```

### 3️⃣ Habilitar APIs (executar um por vez)
```bash
gcloud services enable run.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 4️⃣ Criar Artifact Registry
```bash
gcloud artifacts repositories create couples-financials \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for Couples Financials"
```

### 5️⃣ Configurar Docker
```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### 6️⃣ Criar Service Account
```bash
gcloud iam service-accounts create github-actions-sa \
  --display-name="GitHub Actions Service Account" \
  --description="Service account for CI/CD with GitHub Actions"
```

### 7️⃣ Dar permissões à Service Account
```bash
gcloud projects add-iam-policy-binding couplesfinancials \
  --member="serviceAccount:github-actions-sa@couplesfinancials.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding couplesfinancials \
  --member="serviceAccount:github-actions-sa@couplesfinancials.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding couplesfinancials \
  --member="serviceAccount:github-actions-sa@couplesfinancials.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding couplesfinancials \
  --member="serviceAccount:github-actions-sa@couplesfinancials.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### 8️⃣ Gerar chave JSON
```bash
gcloud iam service-accounts keys create gcp-key.json \
  --iam-account=github-actions-sa@couplesfinancials.iam.gserviceaccount.com
```

### 9️⃣ Criar Secrets no Secret Manager
```bash
# Substitua YOUR_SUPABASE_ANON_KEY pela sua chave real
echo -n "YOUR_SUPABASE_ANON_KEY" | gcloud secrets create supabase-anon-key \
  --data-file=- \
  --replication-policy="automatic"

# Substitua YOUR_SUPABASE_SERVICE_ROLE_KEY pela sua chave real
echo -n "YOUR_SUPABASE_SERVICE_ROLE_KEY" | gcloud secrets create supabase-service-role-key \
  --data-file=- \
  --replication-policy="automatic"
```

---

## ✅ Após a Execução

### 1. Verificar o arquivo gerado
```bash
ls -la gcp-key.json
```

**⚠️ IMPORTANTE: NÃO COMMITAR este arquivo no Git!**

### 2. Copiar conteúdo para GitHub Secrets
```bash
cat gcp-key.json
```

Copie todo o conteúdo (desde `{` até `}`) e adicione no GitHub:

**GitHub Repository > Settings > Secrets and variables > Actions > New repository secret**

Adicione 3 secrets:

| Nome | Valor |
|------|-------|
| `GCP_PROJECT_ID` | `couplesfinancials` |
| `GCP_SERVICE_ACCOUNT_KEY` | Cole o conteúdo completo do `gcp-key.json` |
| `SUPABASE_URL` | `https://elxttabdtddlavhseipz.supabase.co` |

---

## 🔍 Verificação

### Confirmar que tudo foi criado:
```bash
# Verificar Artifact Registry
gcloud artifacts repositories list --location=us-central1

# Verificar Service Account
gcloud iam service-accounts list

# Verificar Secrets
gcloud secrets list

# Verificar APIs habilitadas
gcloud services list --enabled
```

---

## 🆘 Problemas Comuns

### "gcloud: command not found"
- Instale o Google Cloud SDK conforme instruções acima
- Depois execute: `gcloud init`

### "billing not enabled"
1. Acesse: https://console.cloud.google.com/billing/linkedaccount?project=couplesfinancials
2. Associe uma conta de cobrança ao projeto
3. Execute o script novamente

### "Permission denied"
```bash
chmod +x scripts/setup-gcp.sh
```

### "Service account already exists"
- Não é um erro! O recurso já foi criado anteriormente
- Continue normalmente

---

## 📞 Próximos Passos

Após completar este setup:

1. ✅ Configurar GitHub Secrets (veja acima)
2. ⏭️ Configurar `terraform.tfvars`
3. ⏭️ Executar Terraform para provisionar infraestrutura
4. ⏭️ Fazer primeiro deploy

**Me avise quando terminar este passo para continuarmos!** 🚀
