-- Recriar view monthly_financial_summary com SECURITY INVOKER
-- Isso garante que a view respeita RLS do usuário que está consultando

DROP VIEW IF EXISTS public.monthly_financial_summary;

CREATE VIEW public.monthly_financial_summary 
WITH (security_invoker = true)
AS
SELECT 
  t.user_id,
  to_char((t.transaction_date)::timestamp with time zone, 'YYYY-MM'::text) AS month_year,
  EXTRACT(year FROM t.transaction_date) AS year_number,
  EXTRACT(month FROM t.transaction_date) AS month_number,
  COALESCE(sum(
    CASE
      WHEN (t.type = 'income'::transaction_type) THEN t.amount
      ELSE (0)::numeric
    END), (0)::numeric) AS total_income,
  COALESCE(sum(
    CASE
      WHEN (t.type = 'expense'::transaction_type) THEN t.amount
      ELSE (0)::numeric
    END), (0)::numeric) AS total_expenses,
  COALESCE(sum(
    CASE
      WHEN (t.type = 'income'::transaction_type) THEN t.amount
      ELSE (- t.amount)
    END), (0)::numeric) AS net_balance,
  COALESCE(max(
    CASE
      WHEN (c.id IS NOT NULL) THEN c.currency
      ELSE a.currency
    END), 'BRL'::currency_type) AS currency
FROM ((transactions t
  LEFT JOIN cards c ON ((t.card_id = c.id)))
  LEFT JOIN accounts a ON ((t.account_id = a.id)))
GROUP BY t.user_id, (to_char((t.transaction_date)::timestamp with time zone, 'YYYY-MM'::text)), (EXTRACT(year FROM t.transaction_date)), (EXTRACT(month FROM t.transaction_date));