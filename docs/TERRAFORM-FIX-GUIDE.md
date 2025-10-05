# Guia de Correção - Terraform GCP

## Problema Identificado

O Terraform está falhando porque:
1. **Cloud Resource Manager API não está habilitada** - Essa API é necessária para gerenciar IAM policies
2. **Recursos já existem parcialmente** - Secrets e service accounts foram criados em tentativas anteriores

## Solução em 3 Passos

### Passo 1: Habilitar Cloud Resource Manager API Manualmente

```bash
gcloud auth login
gcloud config set project couples-financials-446721

# Habilitar a API manualmente
gcloud services enable cloudresourcemanager.googleapis.com

# Aguardar propagação
echo "Aguardando 60 segundos para propagação..."
sleep 60
```

### Passo 2: Executar Script de Permissões (Atualizado)

```bash
chmod +x scripts/fix-terraform-permissions.sh
./scripts/fix-terraform-permissions.sh
```

O script agora:
- Habilita Cloud Resource Manager API primeiro
- Aguarda 30 segundos para propagação
- Habilita outras APIs necessárias
- Adiciona todas as permissões necessárias

### Passo 3: Re-executar Workflow GitHub Actions

Após executar os passos acima:
1. Aguarde 2-3 minutos para todas as permissões propagarem
2. Vá até GitHub Actions
3. Re-execute o workflow "Terraform Apply"

## Recursos que Já Existem (Normal)

Estes recursos já foram criados e o Terraform agora vai apenas gerenciá-los:
- ✅ `supabase-anon-key` secret
- ✅ `supabase-service-role-key` secret
- ✅ Service accounts (default compute e github-actions-sa)

O Terraform foi ajustado com `lifecycle { ignore_changes }` para não tentar recriá-los.

## Service Accounts no Projeto

Você tem 2 service accounts, ambas são necessárias:

1. **Default compute service account** 
   - Criada automaticamente pelo GCP
   - Usada por recursos compute

2. **GitHub Actions Service Account** (`github-actions-sa`)
   - Criada para CI/CD
   - Precisa das permissões especiais que o script adiciona

Não há conflito entre elas, cada uma tem seu propósito.

## Verificação Final

Depois que o Terraform rodar com sucesso:

```bash
# Verificar o IP do Load Balancer
gcloud compute addresses describe couples-financials-ip \
  --global \
  --project=couples-financials-446721 \
  --format="get(address)"
```

## Se Ainda Falhar

Se após seguir todos os passos ainda houver erro:

1. Verifique no console GCP se a Cloud Resource Manager API está ativa:
   https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com?project=couples-financials-446721

2. Verifique as permissões do github-actions-sa:
   https://console.cloud.google.com/iam-admin/iam?project=couples-financials-446721

3. Aguarde mais 5 minutos (propagação de permissões pode demorar)

## Próximos Passos Após Sucesso

Uma vez que o Terraform funcione:
1. Obter IP do Load Balancer (comando acima)
2. Configurar DNS A records apontando para o IP
3. Aguardar provisão automática do SSL (15 minutos)
