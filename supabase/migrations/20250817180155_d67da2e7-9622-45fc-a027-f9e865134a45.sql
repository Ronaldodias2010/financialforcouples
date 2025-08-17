-- Recalcular saldos dos cartões do usuário atual após a remoção das transações
UPDATE public.cards c
SET 
  current_balance = (
    SELECT COALESCE(SUM(t.amount), 0)
    FROM public.transactions t
    WHERE t.card_id = c.id AND t.type = 'expense'
  ),
  initial_balance = GREATEST(
    0,
    COALESCE(c.credit_limit, 0) - COALESCE(c.initial_balance_original, 0) - (
      SELECT COALESCE(SUM(t.amount), 0)
      FROM public.transactions t
      WHERE t.card_id = c.id AND t.type = 'expense'
    )
  ),
  updated_at = now()
WHERE c.user_id = auth.uid();