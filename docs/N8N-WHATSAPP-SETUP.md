# Configuração N8N - Integração WhatsApp (Arquitetura EDGE-First)

Este guia explica como configurar o N8N para processar mensagens do WhatsApp seguindo a **regra de ouro do projeto**: toda lógica de negócio roda no EDGE (Edge Functions).

---

## 🏗️ Arquitetura EDGE-First

### Regra de Ouro

> **O N8N NÃO classifica, NÃO decide, NÃO formata.**  
> O N8N é apenas um **orquestrador e mensageiro**.

```
┌─────────────────────────────────────────────────────────────────┐
│                      N8N (APENAS ORQUESTRADOR)                   │
├─────────────────────────────────────────────────────────────────┤
│  1. WhatsApp Trigger  →  2. Normaliza Payload  →  3. HTTP POST  │
│                                  ↓                               │
│              whatsapp-message-router (ÚNICA CHAMADA)             │
│                                  ↓                               │
│                    4. Envia Resposta ao WhatsApp                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│             EDGE: whatsapp-message-router (CENTRAL)              │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Detectar idioma (pt/en/es)                                   │
│  ✅ Classificar intenção (query | record | unknown)              │
│  ✅ Se QUERY → chamar whatsapp-query internamente                │
│  ✅ Se RECORD → chamar whatsapp-input + process-financial-input  │
│  ✅ Montar resposta final no idioma correto                      │
│  ✅ Retornar texto pronto para WhatsApp                          │
└─────────────────────────────────────────────────────────────────┘
```

### O que o N8N NÃO faz

| ❌ Proibido no N8N | ✅ Onde deve estar |
|-------------------|-------------------|
| Nó de classificação de intenção | Edge: whatsapp-message-router |
| IF de query vs record | Edge: whatsapp-message-router |
| Prompt de IA | Edge: ai-transaction-processor |
| Lógica de idioma | Edge: whatsapp-message-router |
| Formatação de resposta | Edge: whatsapp-message-router |

---

## 📋 Pré-requisitos

1. **N8N** instalado e funcionando (self-hosted ou cloud)
2. **WhatsApp Business API** configurada (ex: Twilio, Meta Business, 360dialog)
3. **Credenciais Supabase**:
   - `SUPABASE_URL`: https://elxttabdtddlavhseipz.supabase.co
   - `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço (não a anon key!)

---

## 🔗 Edge Function Principal

```
POST https://elxttabdtddlavhseipz.supabase.co/functions/v1/whatsapp-message-router
```

**Esta é a ÚNICA Edge Function que o N8N precisa chamar.**

### Payload de Entrada

```json
{
  "phone_number": "+5511999999999",
  "message": "Gastei 50 no uber",
  "whatsapp_message_id": "wamid.xxx..."
}
```

### Payload de Saída

```json
{
  "success": true,
  "action": "reply",
  "response": "✅ Transação registrada!\n\n💸 Despesa: R$ 50,00\n📁 Categoria: Transporte\n📝 Uber",
  "language": "pt",
  "intent": "record",
  "status": "processed",
  "transaction_id": "uuid",
  "user_id": "uuid"
}
```

---

## 🌐 Suporte Multi-Idioma

O sistema suporta mensagens em **Português**, **Inglês** e **Espanhol**:

| Idioma | Registro de Gasto | Consulta de Saldo |
|--------|-------------------|-------------------|
| 🇧🇷 PT | "Gastei 50 no uber" | "Qual meu saldo?" |
| 🇺🇸 EN | "Spent 30 on groceries" | "What are my expenses this month?" |
| 🇪🇸 ES | "Gasté 20 en supermercado" | "¿Cuánto gasté este mes?" |

---

## 🔄 Workflow N8N Simplificado (4 Nós)

### Visão Geral

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  1. WhatsApp     │ →  │  2. Normalize    │ →  │  3. HTTP POST    │ →  │  4. Send Reply   │
│     Trigger      │    │     Payload      │    │     to Router    │    │     WhatsApp     │
└──────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 📥 Nó 1: WhatsApp Trigger

| Campo | Valor |
|-------|-------|
| **Tipo** | Webhook |
| **Nome** | WhatsApp Incoming |
| **Método** | POST |
| **Path** | `/whatsapp-incoming` |

**Output esperado do webhook:**
```json
{
  "from": "+5511999999999",
  "body": "gastei 50 no uber",
  "messageId": "wamid.xxx..."
}
```

---

## 📝 Nó 2: Set (Normalize Payload)

| Campo | Valor |
|-------|-------|
| **Tipo** | Set |
| **Nome** | Normalize Payload |

**Configuração dos campos:**

| Nome do Campo | Valor |
|---------------|-------|
| `phone_number` | `{{ $json.from }}` |
| `message` | `{{ $json.body }}` |
| `whatsapp_message_id` | `{{ $json.messageId }}` |

**Output:**
```json
{
  "phone_number": "+5511999999999",
  "message": "gastei 50 no uber",
  "whatsapp_message_id": "wamid.xxx..."
}
```

---

## 📤 Nó 3: HTTP Request (Call Edge Router)

| Campo | Valor |
|-------|-------|
| **Tipo** | HTTP Request |
| **Nome** | Call Edge Router |
| **Método** | POST |
| **URL** | `https://elxttabdtddlavhseipz.supabase.co/functions/v1/whatsapp-message-router` |

**Headers:**

| Header | Valor |
|--------|-------|
| Content-Type | `application/json` |
| Authorization | `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` |

**Body (JSON):**
```json
{
  "phone_number": "={{ $json.phone_number }}",
  "message": "={{ $json.message }}",
  "whatsapp_message_id": "={{ $json.whatsapp_message_id }}"
}
```

**Resposta esperada (sucesso):**
```json
{
  "success": true,
  "action": "reply",
  "response": "✅ Transação registrada!\n\n💸 Despesa: R$ 50,00\n📁 Categoria: Transporte\n📝 Uber",
  "language": "pt",
  "intent": "record",
  "status": "processed",
  "transaction_id": "abc-123-def",
  "user_id": "user-uuid"
}
```

**Resposta para consulta:**
```json
{
  "success": true,
  "action": "reply",
  "response": "📊 *Resumo do Mês - Janeiro 2026*\n\n💰 Saldo: R$ 5.432,10\n📥 Receitas: R$ 8.500,00\n📤 Despesas: R$ 3.067,90",
  "language": "pt",
  "intent": "query",
  "query_type": "monthly_expenses",
  "user_id": "user-uuid"
}
```

**Resposta para erro (número não cadastrado):**
```json
{
  "success": true,
  "action": "reply",
  "response": "❌ Número não cadastrado. Acesse o app para vincular seu WhatsApp.",
  "language": "pt",
  "intent": "error",
  "error_code": "PHONE_NOT_REGISTERED"
}
```

---

## 📱 Nó 4: HTTP Request (Send WhatsApp Reply)

| Campo | Valor |
|-------|-------|
| **Tipo** | HTTP Request |
| **Nome** | Send WhatsApp Reply |
| **Método** | POST |
| **URL** | URL da sua API WhatsApp (Twilio, Meta, etc.) |

**Body (exemplo Twilio):**
```json
{
  "To": "={{ $('Nó 1').item.json.from }}",
  "Body": "={{ $json.response }}"
}
```

**Body (exemplo Meta/360dialog):**
```json
{
  "messaging_product": "whatsapp",
  "to": "={{ $('Nó 1').item.json.from }}",
  "type": "text",
  "text": {
    "body": "={{ $json.response }}"
  }
}
```

---

## 🔧 Configuração de Credenciais no N8N

### Criar Credencial HTTP Header Auth (Supabase)

1. Vá em **Credentials** → **New**
2. Selecione **Header Auth**
3. Configure:
   - **Name:** Supabase Service Role
   - **Header Name:** Authorization
   - **Header Value:** `Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY`

### Usar no Nó 3

No nó HTTP Request, selecione:
- **Authentication:** Header Auth
- **Credential:** Supabase Service Role

---

## 🚨 Tratamento de Erros

### Nó de Error Handler

Adicione um **Error Trigger** conectado ao Nó 3 para capturar falhas:

```javascript
// Se houver erro no HTTP Request, enviar mensagem de fallback
const fallbackMessage = {
  response: '❌ Ocorreu um erro. Tente novamente em alguns instantes.'
};

return { json: fallbackMessage };
```

### Possíveis Respostas de Erro do Router

| Código | Mensagem | Ação |
|--------|----------|------|
| `PHONE_NOT_REGISTERED` | Número não cadastrado | Encaminhar para onboarding |
| `CATEGORY_REQUIRED` | Categoria não identificada | Resposta com categorias disponíveis |
| Erro genérico | Erro de processamento | Mensagem de fallback |

---

## 📊 Exemplos de Mensagens

### Registro de Transação

| Entrada | Resposta |
|---------|----------|
| "Gastei 50 no uber" | ✅ Transação registrada! 💸 Despesa: R$ 50,00 📁 Categoria: Transporte 📝 Uber |
| "Spent 30 on groceries" | ✅ Transaction recorded! 💸 Expense: R$ 30.00 📁 Category: Food 📝 Groceries |
| "Recebi 5000 de salário" | ✅ Receita registrada! 💰 Valor: R$ 5.000,00 📁 Categoria: Salário 📝 Salário |

### Consultas

| Entrada | Resposta |
|---------|----------|
| "Qual meu saldo?" | 💰 Saldo das Contas: R$ 5.432,10 • Nubank: R$ 3.200,00 • Itaú: R$ 2.232,10 |
| "What are my expenses this month?" | 📊 Monthly Summary - January 2026 📤 Expenses: R$ 3.067,90 🏆 Top categories: 1. Food: R$ 890,50 |
| "Últimas transações" | 📋 Últimas transações: 📤 15/01 \| Uber \| -R$ 50,00 📤 14/01 \| iFood \| -R$ 35,90 |

### Erros

| Entrada | Resposta |
|---------|----------|
| Número não cadastrado | ❌ Número não cadastrado. Acesse o app para vincular seu WhatsApp. |
| "asdfgh" (sem intenção clara) | 🤔 Não entendi sua mensagem. Você pode: 📝 Registrar: "Gastei 50 no uber" 📊 Consultar: "Qual meu saldo?" |

---

## 🔒 Segurança

1. **NUNCA** exponha a `SUPABASE_SERVICE_ROLE_KEY` publicamente
2. Use HTTPS para todas as comunicações
3. Valide o webhook do WhatsApp (assinatura)
4. Implemente rate limiting no N8N
5. Monitore logs para atividades suspeitas

---

## 📈 Monitoramento

### Logs das Edge Functions

Acesse: [Supabase Dashboard → Edge Functions → whatsapp-message-router → Logs](https://supabase.com/dashboard/project/elxttabdtddlavhseipz/functions/whatsapp-message-router/logs)

### Logs N8N

Vá em **Executions** → Selecione a execução → Ver detalhes de cada nó

### Tabelas Úteis

| Tabela | Descrição |
|--------|-----------|
| `incoming_financial_inputs` | Inputs recebidos do WhatsApp |
| `transactions` | Transações criadas (campo `source` = 'whatsapp') |
| `profiles` | Usuários e seus telefones cadastrados |

---

## 🆘 Suporte

- **Logs Edge Functions:** [Supabase Dashboard](https://supabase.com/dashboard/project/elxttabdtddlavhseipz/functions)
- **Logs N8N:** Executions → Ver detalhes
- **Documentação Supabase:** https://supabase.com/docs/guides/functions

---

## 📦 Edge Functions Auxiliares (Chamadas Internamente)

Estas funções são chamadas **internamente** pelo `whatsapp-message-router`. O N8N **não precisa** chamá-las diretamente:

| Função | Responsabilidade |
|--------|------------------|
| `whatsapp-input` | Criar/atualizar inputs de transação |
| `whatsapp-query` | Processar consultas financeiras |
| `process-financial-input` | Resolver hints e criar transações |
| `detect-message-intent` | Detectar idioma e intenção (legado, integrado no router) |
| `get-user-options` | Buscar categorias/contas/cartões do usuário |
