# 🚨 Solução para Erro CloudFront Functions

## Problema
Erro: `TooManyFunctions` ao criar CloudFront Function durante o deploy.

## Causa
AWS tem um limite de CloudFront Functions por conta (25 por padrão).

## Soluções

### Opção 1: Deploy sem CloudFront Function (Recomendado)
O deploy foi ajustado para não criar a função CloudFront por padrão:

```bash
# Deploy sem função CloudFront (funciona normalmente)
./scripts/deploy.sh
```

### Opção 2: Limpar Funções CloudFront Existentes
Se você quiser usar a função CloudFront:

1. **Listar funções existentes:**
```bash
aws cloudfront list-functions --stage DEVELOPMENT
```

2. **Deletar funções não utilizadas:**
```bash
aws cloudfront delete-function --name NOME_DA_FUNCAO --if-match ETAG
```

3. **Deploy com função habilitada:**
```bash
# No terraform.tfvars, configure:
cloudfront_create_spa_function = true
```

### Opção 3: Usar Função CloudFront Existente
Se você já tem uma função que pode reutilizar:

1. **Identifique o ARN da função:**
```bash
aws cloudfront get-function --name SUA_FUNCAO_EXISTENTE --stage LIVE
```

2. **Configure manualmente no CloudFront:**
   - Acesse AWS Console > CloudFront
   - Edite a distribuição
   - Configure a função manualmente

## Impacto da Solução

### ✅ Com CloudFront Function
- URLs da SPA funcionam perfeitamente (`/auth`, `/dashboard`, etc.)
- Rewrite automático para `index.html`

### ⚠️ Sem CloudFront Function
- **URLs diretas podem retornar 403/404**
- Navegação dentro da app funciona normalmente
- **Solução**: Configure custom error pages no CloudFront

## Error Pages Configuradas
A distribuição CloudFront já está configurada com error pages:
- 403 → 200 `/index.html`
- 404 → 200 `/index.html`

Isso resolve a maioria dos casos de roteamento SPA.

## Verificação Pós-Deploy

Teste estas URLs após o deploy:
```bash
# URL base (deve funcionar)
curl -I https://seu-cloudfront-domain.com/

# URL de rota SPA (deve retornar 200)
curl -I https://seu-cloudfront-domain.com/auth

# Health check (deve retornar 200)
curl -I https://seu-cloudfront-domain.com/health
```

## Deploy Atual
O sistema está configurado para:
- ✅ CloudFront habilitado
- ✅ Error pages configuradas
- ❌ CloudFront Function desabilitada (para evitar erro de limite)
- ✅ Cache configurado para assets estáticos

**Resultado**: A aplicação funcionará normalmente mesmo sem a CloudFront Function.