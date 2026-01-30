
# Plano: Corrigir URL de Confirmação de Email

## Problema Identificado

O link de confirmação de email está usando o domínio do Lovable (`7150d9bc-0276-4ec3-9617-5a690eb3a444.lovableproject.com`) em vez do domínio de produção (`www.couplesfinancials.com`).

**Causa raiz**: A Edge Function `send-confirmation` usa `req.headers.get("origin")` para determinar o domínio de redirecionamento. Quando o usuário clica em "Reenviar email" a partir do preview do Lovable, o header `origin` contém o domínio do preview, não o domínio de produção.

**Linha problemática** (linha 178):
```javascript
const origin = req.headers.get("origin") || "https://couplesfinancials.com";
```

## Solução

Forçar o uso do domínio de produção `https://couplesfinancials.com` em todas as Edge Functions que geram links para o usuário, eliminando a dependência do header `origin`.

## Arquivos a Modificar

### 1. `supabase/functions/send-confirmation/index.ts`
- Remover a lógica de fallback com `origin`
- Usar sempre `https://couplesfinancials.com` como base URL

**De:**
```javascript
const origin = req.headers.get("origin") || "https://couplesfinancials.com";
const redirectTo = `${origin}/email-confirmation?lang=${lang}`;
```

**Para:**
```javascript
const baseUrl = "https://couplesfinancials.com";
const redirectTo = `${baseUrl}/email-confirmation?lang=${lang}`;
```

### 2. `supabase/functions/send-premium-welcome/index.ts`
- Mesma correção para o `loginUrl`

### 3. `supabase/functions/send-password-reset/index.ts`
- Mesma correção para o `loginUrl`

## Resultado Esperado

- Todos os emails de confirmação redirecionarão para `https://couplesfinancials.com/email-confirmation`
- Links de login em emails premium irão para `https://couplesfinancials.com/auth`
- Links de reset de senha irão para `https://couplesfinancials.com/auth`

---

## Seção Técnica

### Detalhes da Implementação

```text
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO ATUAL (PROBLEMA)                   │
├─────────────────────────────────────────────────────────────┤
│  Usuário clica "Reenviar"                                   │
│         ↓                                                   │
│  Frontend envia request com origin: lovableproject.com      │
│         ↓                                                   │
│  Edge Function usa origin como base URL                     │
│         ↓                                                   │
│  Link gerado: lovableproject.com/email-confirmation         │
│         ↓                                                   │
│  ❌ Usuário clica → Erro (domínio errado)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   FLUXO CORRIGIDO                           │
├─────────────────────────────────────────────────────────────┤
│  Usuário clica "Reenviar"                                   │
│         ↓                                                   │
│  Frontend envia request (origin ignorado)                   │
│         ↓                                                   │
│  Edge Function usa couplesfinancials.com fixo               │
│         ↓                                                   │
│  Link gerado: couplesfinancials.com/email-confirmation      │
│         ↓                                                   │
│  ✅ Usuário clica → Confirmação funciona!                   │
└─────────────────────────────────────────────────────────────┘
```

### Funções Afetadas
| Função | Variável | Uso Atual | Correção |
|--------|----------|-----------|----------|
| `send-confirmation` | `origin` | `redirectTo` para Supabase generateLink | Fixar `couplesfinancials.com` |
| `send-premium-welcome` | `baseUrl` | `loginUrl` no template de email | Fixar `couplesfinancials.com` |
| `send-password-reset` | `origin` | `loginUrl` no template de email | Fixar `couplesfinancials.com` |

### Consideração sobre Supabase

O Supabase também precisa ter `https://couplesfinancials.com` configurado nas **Redirect URLs** em:
- **Authentication > URL Configuration > Redirect URLs**

Sem isso, o Supabase rejeitará o redirect mesmo com a correção no código.
