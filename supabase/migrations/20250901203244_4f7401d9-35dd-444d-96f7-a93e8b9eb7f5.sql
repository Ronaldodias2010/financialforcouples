-- Drop existing view
DROP VIEW IF EXISTS public.monthly_financial_summary;

-- Create updated view with conditional date filtering to match dashboard logic
CREATE VIEW public.monthly_financial_summary AS 
SELECT 
  t.user_id,
  EXTRACT(MONTH FROM 
    CASE 
      WHEN t.type = 'expense' AND t.payment_method = 'credit_card' THEN t.created_at
      ELSE t.transaction_date 
    END
  )::integer as month_number,
  EXTRACT(YEAR FROM 
    CASE 
      WHEN t.type = 'expense' AND t.payment_method = 'credit_card' THEN t.created_at
      ELSE t.transaction_date 
    END
  )::integer as year_number,
  -- Use same conditional logic for month_year
  TO_CHAR(
    CASE 
      WHEN t.type = 'expense' AND t.payment_method = 'credit_card' THEN t.created_at
      ELSE t.transaction_date 
    END, 'YYYY-MM'
  ) as month_year,
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses,
  -- Net balance calculation
  COALESCE(
    SUM(CASE WHEN t.type = 'income' THEN t.amount WHEN t.type = 'expense' THEN -t.amount ELSE 0 END), 
    0
  ) as net_balance,
  p.preferred_currency as currency
FROM public.transactions t
LEFT JOIN public.profiles p ON t.user_id = p.user_id
GROUP BY 
  t.user_id, 
  -- Group by conditional date
  EXTRACT(MONTH FROM 
    CASE 
      WHEN t.type = 'expense' AND t.payment_method = 'credit_card' THEN t.created_at
      ELSE t.transaction_date 
    END
  ), 
  EXTRACT(YEAR FROM 
    CASE 
      WHEN t.type = 'expense' AND t.payment_method = 'credit_card' THEN t.created_at
      ELSE t.transaction_date 
    END
  ), 
  TO_CHAR(
    CASE 
      WHEN t.type = 'expense' AND t.payment_method = 'credit_card' THEN t.created_at
      ELSE t.transaction_date 
    END, 'YYYY-MM'
  ), 
  p.preferred_currency
ORDER BY year_number DESC, month_number DESC;