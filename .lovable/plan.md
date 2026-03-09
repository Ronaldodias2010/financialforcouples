

## Plano: Reconciliação Automática de Pagamentos de Cartão com Despesas Futuras

### Problema
Quando um pagamento de cartão de crédito é feito via dashboard (`process_card_payment`), o saldo do cartão é atualizado mas as entradas relacionadas em Despesas Futuras (tanto `manual_future_expenses` quanto `recurring_expenses`) não são marcadas como pagas. Isso causa duplicação: o usuário paga mas a conta continua aparecendo.

### Solução

**1. Atualizar a função SQL `process_card_payment`** para incluir reconciliação automática:
- Após processar o pagamento, buscar em `manual_future_expenses` entradas não pagas do mês corrente que estejam vinculadas (via `recurring_expense_id`) a `recurring_expenses` com o mesmo `card_id` do cartão sendo pago
- Também buscar entradas que mencionem o nome do cartão na descrição (fallback por texto)
- Marcar essas entradas como `is_paid = true` e `paid_at = now()`
- Se for pagamento parcial, ainda assim marcar como pago (o valor do próximo mês será recalculado pelo `current_balance` atualizado do cartão)

**2. Atualizar `useSmartCardPayments.tsx`**:
- Remover a lógica duplicada de `findFutureExpenseForCard` que já faz matching por nome — a reconciliação agora será feita no banco

**3. Lógica SQL a ser adicionada no `process_card_payment`:**
```sql
-- Após processar o pagamento, reconciliar com manual_future_expenses
-- Via recurring_expense_id -> recurring_expenses.card_id
UPDATE manual_future_expenses mfe
SET is_paid = true, paid_at = now(), updated_at = now()
FROM recurring_expenses re
WHERE mfe.recurring_expense_id = re.id
  AND re.card_id = p_card_id
  AND mfe.is_paid = false
  AND mfe.due_date >= date_trunc('month', v_payment_date)
  AND mfe.due_date < date_trunc('month', v_payment_date) + interval '1 month';

-- Via descrição contendo o nome do cartão (fallback)
UPDATE manual_future_expenses
SET is_paid = true, paid_at = now(), updated_at = now()
WHERE user_id = p_user_id
  AND is_paid = false
  AND description ILIKE '%' || v_card.name || '%'
  AND due_date >= date_trunc('month', v_payment_date)
  AND due_date < date_trunc('month', v_payment_date) + interval '1 month';
```

### Arquivos afetados
- **Nova migration SQL**: Recriar `process_card_payment` com reconciliação
- **`src/hooks/useSmartCardPayments.tsx`**: Remover lógica manual de reconciliação redundante (linhas 120-145) já que o banco fará automaticamente

