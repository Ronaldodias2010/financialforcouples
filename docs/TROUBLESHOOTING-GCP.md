# 🔧 Troubleshooting GCP Deployment

## ❌ Erro: Permission 'iam.serviceaccounts.actAs' denied

### Sintoma
```
ERROR: (gcloud.run.deploy) [github-actions-sa@***.iam.gserviceaccount.com] 
does not have permission to access namespaces instance [***] (or it may not exist): 
Permission 'iam.serviceaccounts.actAs' denied on service account 
couples-financials-run-sa@***.iam.gserviceaccount.com (or it may not exist).
```

### Causa
A service account `github-actions-sa` precisa de permissão **específica** na service account `couples-financials-run-sa` para poder fazer deploy no Cloud Run usando essa SA.

Ter a role `roles/iam.serviceAccountUser` a nível de projeto **NÃO é suficiente**. A permissão precisa ser concedida diretamente na service account de destino.

### ✅ Solução Rápida

Execute este comando (ou use o script):

```bash
# Opção 1: Usar o script automatizado (RECOMENDADO)
chmod +x scripts/fix-service-account-permissions.sh
./scripts/fix-service-account-permissions.sh

# Opção 2: Comando manual
gcloud iam service-accounts add-iam-policy-binding \
  couples-financials-run-sa@couplesfinancials.iam.gserviceaccount.com \
  --member="serviceAccount:github-actions-sa@couplesfinancials.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### Verificar se funcionou

```bash
# Ver as permissões da Cloud Run SA
gcloud iam service-accounts get-iam-policy \
  couples-financials-run-sa@couplesfinancials.iam.gserviceaccount.com

# Deve mostrar algo como:
# bindings:
# - members:
#   - serviceAccount:github-actions-sa@couplesfinancials.iam.gserviceaccount.com
#   role: roles/iam.serviceAccountUser
```

### Após corrigir

1. Faça um novo push para a branch main
2. Ou re-execute o workflow no GitHub Actions
3. O deploy deve funcionar! 🚀

---

## 🔍 Outros Problemas Comuns

### Cloud Run SA não existe

**Erro:** Service account `couples-financials-run-sa` não existe

**Solução:**
```bash
cd terraform-gcp
terraform apply
```

A SA é criada pelo Terraform. Execute o comando de permissões após o Terraform criar a SA.

---

### GitHub Actions não autenticado

**Erro:** Could not authenticate with Google Cloud

**Solução:**
1. Verifique se o secret `GCP_SERVICE_ACCOUNT_KEY` está configurado no GitHub
2. O valor deve ser o conteúdo completo do arquivo `gcp-key.json`
3. Vá em: Settings → Secrets and variables → Actions → Repository secrets

---

### Artifact Registry não acessível

**Erro:** Permission denied ao fazer push da imagem

**Solução:**
```bash
# Verificar se o Artifact Registry existe
gcloud artifacts repositories describe couples-financials \
  --location=us-central1

# Se não existir, criar:
gcloud artifacts repositories create couples-financials \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for Couples Financials"
```

---

## 📚 Referências

- [Google Cloud: Service Account ActAs](https://cloud.google.com/iam/docs/service-accounts-actas)
- [Cloud Run: Authentication](https://cloud.google.com/run/docs/authenticating/service-to-service)
- [IAM Roles Reference](https://cloud.google.com/iam/docs/understanding-roles)

---

## 🆘 Ainda com problemas?

1. Verifique os logs do GitHub Actions
2. Execute localmente: `./scripts/terraform-local-apply.sh`
3. Consulte: `docs/MIGRATION-AWS-TO-GCP.md`
