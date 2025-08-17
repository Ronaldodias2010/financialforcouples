-- Remover globalmente transações de teste "Pastel" (R$ 51) e recalcular cartões afetados
WITH del_tx AS (
  DELETE FROM public.transactions
  WHERE (lower(trim(description)) = 'pastel' OR description ILIKE '%pastel%')
    AND amount IN (51, 51.00, -51, -51.00)
  RETURNING id, card_id, user_id
),
-- Remover históricos de milhas ligados às transações apagadas
mh AS (
  DELETE FROM public.mileage_history mh
  USING del_tx dt
  WHERE mh.transaction_id = dt.id
  RETURNING mh.id
)
-- Recalcular saldos somente dos cartões afetados
UPDATE public.cards c
SET 
  current_balance = COALESCE((
    SELECT SUM(t.amount) FROM public.transactions t
    WHERE t.card_id = c.id AND t.type = 'expense'
  ), 0),
  initial_balance = GREATEST(
    0,
    COALESCE(c.credit_limit, 0) - COALESCE(c.initial_balance_original, 0) - COALESCE((
      SELECT SUM(t.amount) FROM public.transactions t
      WHERE t.card_id = c.id AND t.type = 'expense'
  ), 0)
  ),
  updated_at = now()
WHERE c.id IN (SELECT DISTINCT card_id FROM del_tx WHERE card_id IS NOT NULL);