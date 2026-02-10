

## Plano: Corrigir Classificacao de Pagamentos de Cartao de Credito

### Resumo

O sistema ja possui logica parcial para excluir pagamentos de cartao dos calculos de despesa (via `dashboardRules.ts`), mas existem caminhos de calculo que nao aplicam essa regra. Alem disso, os pagamentos sao gravados como `type='expense'` no banco, o que causa inconsistencias. Este plano corrige todos os pontos para garantir que pagamentos de fatura nunca aparecam como despesa.

---

### Mudancas

#### 1. Banco de Dados - Funcao `process_card_payment`

Alterar a funcao para gravar pagamentos com `payment_method = 'card_payment'` e `card_transaction_type = 'card_payment'`, garantindo que os filtros existentes continuem funcionando. O `type` permanecera como `expense` no banco (por compatibilidade com triggers existentes), mas sera filtrado em todos os calculos do frontend.

**Alternativa avaliada**: Mudar `type` para `transfer` no banco. Isso quebraria triggers e funcoes RPC existentes que dependem de `type='expense'`. A abordagem mais segura e manter o filtro via `card_transaction_type`.

#### 2. `useFinancialData.tsx` - Corrigir caminhos de calculo duplicados

O arquivo tem dois blocos de calculo (linhas ~359-416) que filtram transacoes manualmente sem usar as regras centralizadas de `dashboardRules.ts`. Esses blocos precisam excluir transacoes com `card_transaction_type = 'card_payment'` para nao contar pagamentos como despesa.

Adicionar filtro: `if (transaction.card_transaction_type === 'card_payment') return;` nos dois blocos (prevTransactions e currentTransactions).

#### 3. Nota explicativa na aba de Cartao de Credito (`CardList.tsx`)

Adicionar um componente informativo abaixo da lista de cartoes com texto em 3 idiomas:

- **PT**: "Pagamentos de cartao nao sao considerados despesas, pois os gastos ja foram contabilizados no momento da compra."
- **EN**: "Credit card payments are not considered expenses, as purchases were already recorded at the time they were made."
- **ES**: "Los pagos de la tarjeta no se consideran gastos, ya que las compras fueron registradas en el momento en que se realizaron."

Usar o icone `Info` do lucide-react com estilo discreto (muted background).

#### 4. Traducoes em `LanguageContext.tsx`

Adicionar chave `cards.paymentNote` nos 3 idiomas para a nota explicativa.

---

### Detalhes Tecnicos

| Arquivo | Alteracao |
|---|---|
| `src/hooks/useFinancialData.tsx` | Adicionar filtro `card_transaction_type === 'card_payment'` nos 2 blocos de calculo manual (prev/current) |
| `src/components/cards/CardList.tsx` | Adicionar nota informativa com icone Info abaixo da lista de cartoes |
| `src/contexts/LanguageContext.tsx` | Adicionar traducao `cards.paymentNote` em PT/EN/ES |
| `src/utils/dashboardRules.ts` | Ja esta correto - nenhuma alteracao necessaria |

### O que NAO muda

- A funcao `dashboardRules.ts` ja exclui pagamentos corretamente nos graficos de categoria e calculos do dashboard principal
- O componente `ExpensesPieChart.tsx` ja usa `isDashboardExpense` que filtra pagamentos
- O `process_card_payment` no banco ja marca `card_transaction_type = 'card_payment'`

