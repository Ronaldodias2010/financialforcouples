-- Garantir que contas de dinheiro existam para admin e adicionar R$ 50,00
DO $$
DECLARE
  admin_user_id UUID;
  cash_account_brl_id UUID;
BEGIN
  -- Buscar ID do usuário admin
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@arxexperience.com.br'
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    -- Criar contas de dinheiro para o admin se não existirem
    PERFORM public.create_cash_accounts_for_user(admin_user_id);
    
    -- Buscar conta de dinheiro BRL do admin
    SELECT id INTO cash_account_brl_id
    FROM public.accounts
    WHERE user_id = admin_user_id 
      AND is_cash_account = true 
      AND currency = 'BRL'
    LIMIT 1;
    
    -- Adicionar R$ 50,00 na conta de dinheiro BRL
    IF cash_account_brl_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET balance = 50.00, 
          updated_at = now()
      WHERE id = cash_account_brl_id;
    END IF;
  END IF;
END
$$;

-- Criar view para automação N8N com dados financeiros mensais
CREATE OR REPLACE VIEW public.monthly_financial_summary AS 
SELECT 
  t.user_id,
  EXTRACT(MONTH FROM t.transaction_date)::integer as month_number,
  EXTRACT(YEAR FROM t.transaction_date)::integer as year_number,
  TO_CHAR(t.transaction_date, 'YYYY-MM') as month_year,
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses,
  COALESCE(
    SUM(CASE WHEN t.type = 'income' THEN t.amount WHEN t.type = 'expense' THEN -t.amount ELSE 0 END), 
    0
  ) as net_balance,
  COALESCE(p.preferred_currency, 'BRL') as currency
FROM public.transactions t
LEFT JOIN public.profiles p ON p.user_id = t.user_id
GROUP BY 
  t.user_id, 
  EXTRACT(MONTH FROM t.transaction_date), 
  EXTRACT(YEAR FROM t.transaction_date), 
  TO_CHAR(t.transaction_date, 'YYYY-MM'), 
  p.preferred_currency
ORDER BY year_number DESC, month_number DESC;

-- Adicionar RLS para a view
ALTER VIEW public.monthly_financial_summary OWNER TO postgres;

-- Criar política RLS para a view
DROP POLICY IF EXISTS "Users can view their own monthly summary" ON public.monthly_financial_summary;
CREATE POLICY "Users can view their own monthly summary" 
ON public.transactions -- RLS aplicada na tabela base
FOR SELECT 
USING ((auth.uid() = user_id) OR (EXISTS ( 
  SELECT 1
  FROM user_couples
  WHERE (user_couples.status = 'active'::text) 
    AND (((user_couples.user1_id = auth.uid()) AND (user_couples.user2_id = transactions.user_id)) 
      OR ((user_couples.user2_id = auth.uid()) AND (user_couples.user1_id = transactions.user_id)))
)));

-- Comentário explicativo sobre a view
COMMENT ON VIEW public.monthly_financial_summary IS 'View para automação N8N - Sumário financeiro mensal por usuário com receitas, despesas e saldo líquido. Acesso via API: /rest/v1/monthly_financial_summary?user_id=eq.{user_id}&month_year=eq.{YYYY-MM}';