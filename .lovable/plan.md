

# Correção dos 2 Problemas Criticos do Cartao Inter Black

## Problema 1: Categoria sempre "Outros"

### Causa Raiz
O fluxo funciona assim: N8N envia a mensagem -> `whatsapp-input` cria o input -> `process-financial-input` processa. O problema esta em DUAS camadas:

1. **A IA do N8N esta enviando `category_hint: "Outros"`** em vez de inferir categorias como "Alimentacao" a partir do contexto (ex: "supermercado", "almoco").
2. **O `whatsapp-input` trata "Outros" como hint valido** - busca a categoria "Outros" no banco, encontra (id: `d07169a9`), e resolve com sucesso. Isso burla a regra critica de "NUNCA usar Outros como fallback".
3. **A inferencia de contexto (linhas 1128-1152)** so roda quando `category_hint` esta VAZIO - mas como a IA envia "Outros", nunca executa. Alem disso, "supermercado" esta mapeado para "Compras" em vez de "Alimentacao" nessa inferencia.

### Correcao

**A) No `whatsapp-input/index.ts` (PATCH handler):**
- Tratar `category_hint = "Outros"` como se fosse vazio (ignorar o hint da IA)
- Forcar a inferencia de contexto a partir do `raw_message` quando o hint for "Outros"
- Corrigir o mapeamento: "supermercado" deve inferir "Alimentacao" (nao "Compras")

**B) No `whatsapp-input/index.ts` (resolucao de categoria):**
- Adicionar verificacao antes da resolucao: se `category_hint` for "Outros", "Other", "Otros", limpar o hint e usar inferencia contextual
- A inferencia contextual ja faz match correto de keywords do raw_message (supermercado -> Alimentacao, padaria -> Alimentacao, etc.)

---

## Problema 2: Saldo do Cartao volta para R$ 5.724,27

### Causa Raiz
O trigger `update_card_balance` recalcula o `current_balance` a cada INSERT/UPDATE/DELETE em `transactions`. A formula atual e:

```
current_balance = SUM(expense transactions)  -- apenas transacoes no sistema
```

O cartao Inter Black tem:
- `initial_balance_original = 10.035,73` (divida pre-existente ao configurar o cartao)
- `SUM(transacoes de despesa) = 5.694,27`
- **Total real da fatura = 10.035,73 + 5.694,27 = 15.730,00** (proximo aos R$ 15.700 que voce ajustou)

Mas o trigger IGNORA o `initial_balance_original`, setando `current_balance = 5.694,27`. Toda vez que uma transacao e criada/editada, o saldo volta para esse valor.

### Correcao

**No trigger `update_card_balance` (migracao SQL):**
- Alterar a formula para incluir o saldo pre-existente:

```
current_balance = COALESCE(initial_balance_original, 0) + total_expenses
```

Isso garante que:
- Saldo da fatura = divida pre-existente + novos gastos registrados
- `initial_balance` (limite disponivel) permanece com a formula atual: `GREATEST(0, credit_limit - initial_balance_original - total_expenses)`
- Ao pagar a fatura (`process_card_payment`), o `initial_balance_original` e reduzido, restaurando o limite

---

## Detalhes Tecnicos

### Arquivo 1: `supabase/functions/whatsapp-input/index.ts`

**Mudanca na secao PATCH (apos o merge de estado, ~linha 635):**
- Antes de resolver categoria, verificar se `category_hint` e "Outros"/"Other"/"Otros"
- Se for, limpar o hint e rodar inferencia contextual a partir do `raw_message`
- Corrigir a lista de inferencia contextual: mover "supermercado" para "Alimentacao"

**Mudanca na inferencia contextual (~linha 1128-1152):**
- Rodar a inferencia tambem quando `category_hint` foi limpado por ser "Outros"
- Adicionar mais keywords: "bolo", "doceira", "padaria", "acougue" em "Alimentacao"

### Arquivo 2: Migracao SQL - `update_card_balance` trigger

```sql
CREATE OR REPLACE FUNCTION public.update_card_balance()
RETURNS TRIGGER ...
-- Em TODOS os blocos (INSERT, UPDATE, DELETE):
-- Buscar initial_balance_original do cartao
-- Alterar: SET current_balance = COALESCE(ibo, 0) + total_expenses
```

### Impacto

- **Problema 1**: Compras em "supermercado", "padaria", "almoco" serao automaticamente categorizadas como "Alimentacao" - a IA nao podera mais "escapar" enviando "Outros"
- **Problema 2**: O saldo do cartao refletira corretamente a divida total (pre-existente + novos gastos) e nao sera mais resetado pelo trigger

