

# Corrigir Consolidacao de Dados na Continuacao de Conversa WhatsApp

## Problema

Quando o usuario responde uma pergunta de follow-up (ex: "cartao de credito"), o fluxo atual faz:

```text
POST (continuacao) → retorna existing_data + user_response
  → N8N envia APENAS user_response para IA extrair dados
    → IA so ve "cartao de credito", nao consegue extrair valor/categoria
      → PATCH recebe dados incompletos → categoria "Outros"
```

O POST retorna `status: 'waiting_user_input'` mas nao resolve a resposta do usuario contra o campo pendente.

## Solucao

Resolver a resposta do usuario **diretamente no POST**, sem reenviar para a IA. O POST deve:

1. Saber qual campo esta pendente (salvo no banco pelo PATCH anterior)
2. Mapear a resposta do usuario para esse campo
3. Retornar `status: 'processed'` (nao `confirmed` - esse e do PATCH 3) com `skip_ai_extraction: true` e `patch_data` consolidado

O N8N ao ver `skip_ai_extraction: true` envia o `patch_data` direto para o PATCH, pulando a IA.

## Fluxo Corrigido

```text
Usuario: "gastei 50 reais no mercado"
  POST → cria input (status: received)
  N8N → IA extrai: amount=50, currency=BRL, category=Alimentacao
  PATCH → falta payment_method → salva pending_question_field='payment_method'
       → retorna waiting_user_input + pergunta
  
Usuario: "cartao de credito nubank"
  POST → le pending_question_field='payment_method' do banco
       → mapeia resposta: payment_method=credit_card, card_hint=nubank
       → retorna status='processed', skip_ai_extraction=true, patch_data consolidado
  N8N → envia PATCH direto com patch_data (sem passar pela IA)
  PATCH → resolve card, tudo OK → status: confirmed
```

---

## Detalhes Tecnicos

### 1. Migration: Adicionar coluna `pending_question_field`

Criar migration para adicionar coluna `pending_question_field TEXT` na tabela `incoming_financial_inputs`. Essa coluna armazena o nome do campo que o sistema esta perguntando ao usuario (ex: `payment_method`, `category`, `card`, `account`, `amount`, `transaction_type`).

### 2. Arquivo: `supabase/functions/whatsapp-input/index.ts`

#### Mudanca A: POST - Resolver resposta diretamente (linhas 452-519)

Dentro do bloco `if (pendingInput)`, ANTES de retornar, adicionar logica de resolucao direta:

```text
1. Buscar pending_question_field do pendingInput (consulta ao banco ja feita na linha 401)
   - Precisa adicionar 'pending_question_field' ao SELECT da query (linha 401)
   
2. Se pending_question_field existe:
   a. Criar funcao mapResponseToField(userResponse, field) que:
      - 'payment_method': detecta pix/credito/debito/dinheiro na resposta
        → retorna { payment_method: 'credit_card'|'debit_card'|'pix'|'cash' }
        → Se mencionar nome de cartao/conta, tambem extrai card_hint ou account_hint
      - 'category': usar resposta como category_hint
      - 'card': usar resposta como card_hint  
      - 'account': usar resposta como account_hint
      - 'amount': extrair numero da resposta
      - 'transaction_type': detectar despesa/receita/expense/income
      
   b. Atualizar o input no banco com os campos mapeados
   
   c. Retornar:
      {
        success: true,
        status: 'processed',        // <- 'processed' no passo 1, nao 'confirmed'
        input_id: pendingInput.id,
        skip_ai_extraction: true,    // <- flag para N8N pular IA
        user_id: profile.user_id,
        patch_data: {                // <- dados consolidados para enviar ao PATCH
          input_id: pendingInput.id,
          ...existing_data,          // dados ja acumulados
          ...mapped_fields           // campo(s) resolvido(s) da resposta
        }
      }

3. Se NAO tem pending_question_field → manter fluxo atual (enviar para IA)
```

#### Mudanca B: PATCH - Salvar pending_question_field (linhas 1419-1473)

No bloco que gera a resposta `waiting_user_input`, salvar o campo da primeira pergunta:

```text
No updateData (linha 1419), adicionar:
  pending_question_field: questions.length > 0 ? questions[0].field : null

Quando status = 'confirmed', limpar:
  pending_question_field: null
```

#### Funcao auxiliar: mapResponseToField

```text
function mapResponseToField(response: string, field: string):
  
  switch(field):
    case 'payment_method':
      msg = response.toLowerCase()
      if msg contem 'pix' → { payment_method: 'pix' }
      if msg contem 'credito/credit' → { payment_method: 'credit_card' }
        + extrair card_hint (nome apos credito, ex: "nubank")
      if msg contem 'debito/debit' → { payment_method: 'debit_card' }
        + extrair card_hint
      if msg contem 'dinheiro/cash/efectivo' → { payment_method: 'cash' }
      
    case 'category':
      → { category_hint: response.trim() }
      
    case 'card':
      → { card_hint: response.trim() }
      
    case 'account':
      → { account_hint: response.trim() }
      
    case 'amount':
      extrair numero da string (regex para decimais)
      → { amount: numero_extraido }
      
    case 'transaction_type':
      if msg contem despesa/gasto/expense → { transaction_type: 'expense' }
      if msg contem receita/income → { transaction_type: 'income' }
```

### 3. Contrato de Status Atualizado

O comentario de status no topo do arquivo (linhas 12-24) permanece correto:
- `received` → input criado, pronto para IA
- `waiting_user_input` → faltam dados, pergunta enviada
- **`processed`** → dados consolidados no POST de continuacao (skip_ai_extraction=true) OU transacao ja criada
- `confirmed` → PATCH resolveu tudo, pronto para process-financial-input (PATCH 3)

**Importante**: O status `processed` no POST de continuacao indica "dados consolidados, prontos para enviar ao PATCH". NAO e o mesmo que "transacao criada". O N8N diferencia pelo campo `skip_ai_extraction`.

### 4. Ajuste no SELECT do pendingInput (linha 401)

Adicionar `pending_question_field` ao SELECT da query que busca inputs pendentes para que o POST saiba qual campo esta pendente.

### Resumo das mudancas

| Arquivo | Mudanca |
|---------|---------|
| Migration nova | Adicionar coluna `pending_question_field TEXT` |
| whatsapp-input POST (linhas 401, 452-519) | Adicionar campo ao SELECT + logica de resolucao direta |
| whatsapp-input PATCH (linhas 1419-1438) | Salvar `pending_question_field` no updateData |
| whatsapp-input (nova funcao) | `mapResponseToField()` para mapear resposta do usuario |

