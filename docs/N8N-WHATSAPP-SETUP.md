# Configuração N8N - Integração WhatsApp

Este guia explica como configurar o N8N para processar mensagens do WhatsApp e criar transações financeiras automaticamente.

## 📋 Pré-requisitos

1. **N8N** instalado e funcionando (self-hosted ou cloud)
2. **WhatsApp Business API** configurada (ex: Twilio, Meta Business, 360dialog)
3. **Credenciais Supabase**:
   - `SUPABASE_URL`: URL do seu projeto
   - `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço (não a anon key!)
4. **API OpenAI** para processamento de linguagem natural

## 🔗 URLs das Edge Functions

```
POST   ${SUPABASE_URL}/functions/v1/detect-message-intent  # Detectar idioma e intenção (NOVO!)
POST   ${SUPABASE_URL}/functions/v1/whatsapp-query         # Consultas (saldo, gastos do mês) (NOVO!)
POST   ${SUPABASE_URL}/functions/v1/whatsapp-input         # Criar input para registro
PATCH  ${SUPABASE_URL}/functions/v1/whatsapp-input         # Atualizar com dados da IA
GET    ${SUPABASE_URL}/functions/v1/whatsapp-input         # Consultar status
GET    ${SUPABASE_URL}/functions/v1/get-user-options       # Obter opções do usuário
POST   ${SUPABASE_URL}/functions/v1/process-financial-input  # Processar e criar transação
```

---

## 🌐 Suporte Multi-Idioma (NOVO!)

O sistema agora suporta mensagens em **Português**, **Inglês** e **Espanhol**:

### Exemplos de Entradas Suportadas

| Idioma | Registro de Gasto | Consulta de Saldo |
|--------|-------------------|-------------------|
| 🇧🇷 PT | "Gastei 50 no uber" | "Qual meu saldo?" |
| 🇺🇸 EN | "Spent 30 on groceries" | "What are my expenses this month?" |
| 🇪🇸 ES | "Gasté 20 en supermercado" | "¿Cuánto gasté este mes?" |

### Nova Edge Function: `detect-message-intent`

Antes de processar, detecta:
- **Idioma**: pt, en, es
- **Intenção**: `query` (consulta) ou `record` (registro)
- **Tipo de consulta**: balance, monthly_expenses, category_summary, etc.

```json
// Request
{ "message": "What are my expenses this month?" }

// Response
{
  "success": true,
  "language": "en",
  "intent": "query",
  "query_type": "monthly_expenses"
}
```

### Nova Edge Function: `whatsapp-query`

Responde consultas financeiras no idioma do usuário:

```json
// Request
{
  "user_id": "uuid",
  "query_type": "monthly_expenses",
  "language": "en"
}

// Response (English)
{
  "success": true,
  "response": "📊 *Monthly Summary - January 2026*\n\n💰 Account Balance: R$ 5,432.10\n📥 Income: R$ 8,500.00\n📤 Expenses: R$ 3,067.90\n\n🏆 Top categories:\n1. Food: R$ 890.50"
}
```

---

## 🔄 Fluxo Completo N8N (ATUALIZADO)

### Visão Geral do Workflow

```
WhatsApp Webhook 
    ↓
Detectar Intenção (detect-message-intent)
    ↓
┌───────────────────────┬───────────────────────┐
│ Se intent = 'query'   │ Se intent = 'record'  │
│         ↓             │          ↓            │
│  Buscar Dados         │  Criar Input          │
│  (whatsapp-query)     │  (whatsapp-input)     │
│         ↓             │          ↓            │
│  Responder WhatsApp   │  Buscar Opções        │
│                       │          ↓            │
│                       │  IA Processa          │
│                       │          ↓            │
│                       │  Atualizar Input      │
│                       │          ↓            │
│                       │  Criar Transação      │
│                       │          ↓            │
│                       │  Responder WhatsApp   │
└───────────────────────┴───────────────────────┘
```

---

## 📥 Nó 1: Webhook WhatsApp

**Tipo:** Webhook  
**Método:** POST  
**Path:** `/whatsapp-incoming`

O webhook recebe mensagens do WhatsApp no formato:

```json
{
  "from": "+5511999999999",
  "body": "gastei 50 reais no uber",
  "messageId": "wamid.xxx..."
}
```

---

## 📤 Nó 2: Criar Input no Sistema

**Tipo:** HTTP Request  
**Método:** POST  
**URL:** `${SUPABASE_URL}/functions/v1/whatsapp-input`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
}
```

**Body:**
```json
{
  "phone_number": "{{ $json.from }}",
  "message": "{{ $json.body }}",
  "whatsapp_message_id": "{{ $json.messageId }}"
}
```

**Respostas:**
- `201`: Input criado com sucesso
- `404`: Número não cadastrado
- `403`: WhatsApp não verificado
- `409`: Mensagem duplicada

---

## 📋 Nó 3: Buscar Opções do Usuário

**Tipo:** HTTP Request  
**Método:** GET  
**URL:** `${SUPABASE_URL}/functions/v1/get-user-options?user_id={{ $json.user_id }}`

**Headers:**
```json
{
  "Authorization": "Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
}
```

**Resposta:**
```json
{
  "success": true,
  "options": {
    "categories": [
      {"id": "uuid", "name": "Transporte", "type": "expense"},
      {"id": "uuid", "name": "Alimentação", "type": "expense"}
    ],
    "accounts": [
      {"id": "uuid", "name": "Nubank", "type": "checking"}
    ],
    "cards": [
      {"id": "uuid", "name": "Nubank Platinum", "last_four": "1234"}
    ]
  }
}
```

---

## 🤖 Nó 4: Processar com OpenAI

**Tipo:** OpenAI (ou HTTP Request para API)  
**Modelo:** gpt-4o-mini ou gpt-4o

**System Prompt:**
```
Você é um assistente financeiro que extrai informações de transações a partir de mensagens em português.

Extraia as seguintes informações:
- amount: valor numérico da transação
- currency: moeda (BRL, USD, EUR)
- transaction_type: "expense" ou "income"
- category_hint: categoria da transação
- account_hint: conta bancária mencionada
- card_hint: cartão mencionado
- description_hint: descrição curta da transação
- transaction_date: data (se mencionada, senão null)
- owner_user: "user1" ou "user2" (se mencionado quem gastou)

Categorias disponíveis do usuário:
{{ $json.options.categories | map(item => item.name) | join(", ") }}

Contas disponíveis:
{{ $json.options.accounts | map(item => item.name) | join(", ") }}

Cartões disponíveis:
{{ $json.options.cards | map(item => item.name) | join(", ") }}

Responda APENAS com JSON válido, sem markdown.
```

**User Prompt:**
```
Mensagem: {{ $('Nó 2').json.raw_message }}
```

**Resposta esperada da IA:**
```json
{
  "amount": 50.00,
  "currency": "BRL",
  "transaction_type": "expense",
  "category_hint": "Transporte",
  "account_hint": null,
  "card_hint": null,
  "description_hint": "Uber",
  "transaction_date": null,
  "owner_user": "user1",
  "confidence_score": 0.92
}
```

---

## 📝 Nó 5: Atualizar Input com Dados da IA

**Tipo:** HTTP Request  
**Método:** PATCH  
**URL:** `${SUPABASE_URL}/functions/v1/whatsapp-input`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
}
```

**Body:**
```json
{
  "input_id": "{{ $('Nó 2').json.input_id }}",
  "amount": {{ $json.amount }},
  "currency": "{{ $json.currency }}",
  "transaction_type": "{{ $json.transaction_type }}",
  "category_hint": "{{ $json.category_hint }}",
  "account_hint": "{{ $json.account_hint }}",
  "card_hint": "{{ $json.card_hint }}",
  "description_hint": "{{ $json.description_hint }}",
  "transaction_date": "{{ $json.transaction_date }}",
  "confidence_score": {{ $json.confidence_score }},
  "owner_user": "{{ $json.owner_user }}"
}
```

---

## ✅ Nó 6: Processar e Criar Transação (Opcional - Alta Confiança)

**Condição:** Só executar se `confidence_score >= 0.85`

**Tipo:** HTTP Request  
**Método:** POST  
**URL:** `${SUPABASE_URL}/functions/v1/process-financial-input`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
}
```

**Body:**
```json
{
  "input_id": "{{ $('Nó 2').json.input_id }}",
  "force_confirm": false
}
```

**⚠️ IMPORTANTE: Categoria Obrigatória para WhatsApp**

Para inputs do WhatsApp, a **categoria é obrigatória**. Se não for fornecida ou não for encontrada, o erro retornado será:

```json
{
  "success": false,
  "error": "Categoria é obrigatória para transações via WhatsApp",
  "error_code": "CATEGORY_REQUIRED",
  "hint": "Informe a categoria na mensagem (ex: 'gastei 50 em alimentação')"
}
```

---

## 📱 Nó 7: Responder no WhatsApp

**Tipo:** HTTP Request (para sua API WhatsApp)

**Mensagem de Sucesso (alta confiança):**
```
✅ Transação registrada!

💸 {{ $json.transaction_type === 'expense' ? 'Despesa' : 'Receita' }}: R$ {{ $json.amount }}
📁 Categoria: {{ $json.category_hint }}
📝 {{ $json.description_hint }}

Transação criada automaticamente.
```

**Mensagem de Confirmação Necessária (baixa confiança):**
```
🔍 Entendi sua mensagem:

💸 Valor: R$ {{ $json.amount }}
📁 Categoria: {{ $json.category_hint }}
📝 {{ $json.description_hint }}

⚠️ Confirme no app para registrar a transação.
```

**Mensagem de Erro - Categoria Faltando:**
```
⚠️ Não consegui identificar a categoria.

Por favor, reformule sua mensagem incluindo a categoria.
Exemplo: "gastei 50 em alimentação"

Categorias disponíveis: {{ $('Nó 3').json.options.categories.map(c => c.name).join(', ') }}
```

---

## 🔧 Configuração de Credenciais no N8N

### Criar Credencial HTTP Header Auth

1. Vá em **Credentials** → **New**
2. Selecione **Header Auth**
3. Configure:
   - **Name:** Supabase Service Role
   - **Name:** Authorization
   - **Value:** Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY

### Criar Credencial OpenAI

1. Vá em **Credentials** → **New**
2. Selecione **OpenAI**
3. Adicione sua API Key

---

## 🚨 Tratamento de Erros

### Nó de Error Handler

Adicione um nó para capturar erros e responder apropriadamente:

```javascript
// Código para Error Workflow
const errorType = $json.error;

const messages = {
  'phone_not_registered': '❌ Este número não está cadastrado. Acesse nosso app para criar sua conta.',
  'whatsapp_not_verified': '⚠️ Seu WhatsApp ainda não foi verificado. Verifique no app primeiro.',
  'duplicate_message': '🔄 Esta mensagem já foi processada.',
  'default': '❌ Ocorreu um erro. Tente novamente mais tarde.'
};

return {
  message: messages[errorType] || messages.default
};
```

---

## 📊 Exemplos de Mensagens Suportadas

| Mensagem do Usuário | Extração Esperada |
|---------------------|-------------------|
| "gastei 50 reais no uber" | R$ 50, Transporte, Uber |
| "almoco 35,90 no ifood" | R$ 35.90, Alimentação, iFood |
| "recebi 5000 de salario" | R$ 5000, income, Salário |
| "paguei 150 de luz" | R$ 150, Contas, Luz |
| "minha esposa gastou 200 no mercado" | R$ 200, Mercado, user2 |
| "comprei gasolina 250 no cartão nubank" | R$ 250, Transporte, Nubank |

---

## 🔒 Segurança

1. **NUNCA** exponha a `SUPABASE_SERVICE_ROLE_KEY` publicamente
2. Use HTTPS para todas as comunicações
3. Valide o webhook do WhatsApp (assinatura)
4. Implemente rate limiting no N8N
5. Monitore logs para atividades suspeitas

---

## 📈 Monitoramento

Recomendamos adicionar nós de logging para:

1. Mensagens recebidas
2. Erros de processamento
3. Transações criadas
4. Tempo de resposta

Use o **N8N Error Workflow** para notificações de falhas.

---

## 🆘 Suporte

- Logs das Edge Functions: Supabase Dashboard → Edge Functions → Logs
- Logs N8N: Executions → Ver detalhes
- Tabela de inputs: `incoming_financial_inputs` no Supabase
- Tabela de transações: `transactions` (campo `source` indica origem: app, whatsapp, import, api, recurring)
