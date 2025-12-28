-- Corrigir view para usar SECURITY INVOKER (padrão seguro)
DROP VIEW IF EXISTS public.ai_transactions_view;
CREATE VIEW public.ai_transactions_view 
WITH (security_invoker = true)
AS
SELECT t.id, t.user_id, t.type, t.amount, t.currency, t.description, t.transaction_date,
  t.status, t.owner_user, t.payment_method, c.name AS category_name, c.color AS category_color,
  a.name AS account_name, a.account_type, cd.name AS card_name, cd.card_type
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN accounts a ON t.account_id = a.id
LEFT JOIN cards cd ON t.card_id = cd.id
WHERE t.deleted_at IS NULL AND t.status = 'completed';

COMMENT ON VIEW ai_transactions_view IS 'View segura para IA - usa SECURITY INVOKER';