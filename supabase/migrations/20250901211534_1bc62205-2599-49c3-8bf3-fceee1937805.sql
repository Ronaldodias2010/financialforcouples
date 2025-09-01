
-- Recria a view para refletir APENAS movimentações realizadas no mês
-- Critério de realizado: a transação afeta uma conta (account_id IS NOT NULL)
-- - Receitas e despesas: por transaction_date (data contábil)
-- - Compras em cartão (sem account_id) ficam fora; o pagamento da fatura (com account_id) entra como despesa no mês do pagamento

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
    t.transaction_date IS NOT NULL
    AND t.account_id IS NOT NULL
    AND t.type IN ('income', 'expense')
)
SELECT
  rm.user_id,
  EXTRACT(YEAR FROM rm.accounting_date)::integer AS year_number,
  EXTRACT(MONTH FROM rm.accounting_date)::integer AS month_number,
  TO_CHAR(rm.accounting_date, 'YYYY-MM') AS month_year,
  COALESCE(SUM(CASE WHEN rm.type = 'income'  THEN rm.amount ELSE 0 END), 0) AS total_income,
  COALESCE(SUM(CASE WHEN rm.type = 'expense' THEN rm.amount ELSE 0 END), 0) AS total_expenses,
  COALESCE(SUM(CASE WHEN rm.type = 'income'  THEN rm.amount ELSE -rm.amount END), 0) AS net_balance,
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

-- (Opcional) Validação rápida no mês corrente:
-- SELECT * FROM public.monthly_financial_summary
-- WHERE month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
-- ORDER BY user_id;
