
-- Recria a view para refletir apenas movimentações realizadas no mês
-- - Receitas: por transaction_date
-- - Despesas: exclui compras de cartão (payment_method = 'credit_card'),
--             considera apenas o que efetivamente saiu da conta no mês (transaction_date)

CREATE OR REPLACE VIEW public.monthly_financial_summary AS
WITH realized_movements AS (
  SELECT
    t.user_id,
    t.currency,
    t.type,
    t.amount,
    t.transaction_date::date AS accounting_date
  FROM public.transactions t
  WHERE
    -- Receitas do mês (sempre por transaction_date)
    (t.type = 'income' AND t.transaction_date IS NOT NULL)

    OR

    -- Despesas realizadas (exclui compras no cartão; fatura paga entra como despesa normal)
    (t.type = 'expense' AND t.payment_method IS DISTINCT FROM 'credit_card' AND t.transaction_date IS NOT NULL)
)
SELECT
  rm.user_id,
  EXTRACT(YEAR FROM rm.accounting_date)::integer AS year_number,
  EXTRACT(MONTH FROM rm.accounting_date)::integer AS month_number,
  TO_CHAR(rm.accounting_date, 'YYYY-MM') AS month_year,
  COALESCE(SUM(CASE WHEN rm.type = 'income' THEN rm.amount ELSE 0 END), 0) AS total_income,
  COALESCE(SUM(CASE WHEN rm.type = 'expense' THEN rm.amount ELSE 0 END), 0) AS total_expenses,
  COALESCE(SUM(CASE WHEN rm.type = 'income' THEN rm.amount ELSE -rm.amount END), 0) AS net_balance,
  COALESCE(p.preferred_currency, rm.currency) AS currency
FROM realized_movements rm
LEFT JOIN public.profiles p
  ON p.user_id = rm.user_id
GROUP BY
  rm.user_id,
  year_number,
  month_number,
  month_year,
  COALESCE(p.preferred_currency, rm.currency)
ORDER BY year_number DESC, month_number DESC;
