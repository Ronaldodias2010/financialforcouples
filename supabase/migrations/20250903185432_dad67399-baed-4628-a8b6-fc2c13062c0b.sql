-- Fix the GROUP BY clause in the view
CREATE VIEW monthly_financial_summary AS
SELECT 
  t.user_id,
  TO_CHAR(DATE_TRUNC('month', t.transaction_date), 'YYYY-MM') AS month_year,
  EXTRACT(YEAR FROM DATE_TRUNC('month', t.transaction_date)) AS year_number,
  EXTRACT(MONTH FROM DATE_TRUNC('month', t.transaction_date)) AS month_number,
  SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS total_expenses,
  SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) AS net_balance,
  t.currency
FROM transactions t
GROUP BY t.user_id, DATE_TRUNC('month', t.transaction_date), t.currency;