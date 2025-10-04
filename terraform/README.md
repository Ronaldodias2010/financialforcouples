# ⚠️ LEGACY AWS INFRASTRUCTURE - NÃO USAR

Este diretório contém a infraestrutura AWS **ANTIGA** que foi migrada para GCP.

## ✅ Use a infraestrutura GCP:
- **Diretório:** `terraform-gcp/`
- **Workflows:** `.github/workflows/terraform-*.yml` e `.github/workflows/deploy-gcp.yml`
- **Documentação:** `docs/MIGRATION-AWS-TO-GCP.md`

## ⚠️ Este diretório está mantido apenas para:
1. Referência histórica
2. Rollback de emergência (se necessário)

## 🗑️ Para remover completamente a infraestrutura AWS:
1. Siga os passos em `docs/MIGRATION-AWS-TO-GCP.md` (Phase 10)
2. Execute `terraform destroy` neste diretório
3. Delete este diretório após confirmar que GCP está funcionando

---

**Status:** DEPRECATED - Use `terraform-gcp/` para todas as operações
