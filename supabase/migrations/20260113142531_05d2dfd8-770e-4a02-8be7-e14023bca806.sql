-- Limpar novamente qualquer input travado em waiting_user_input
UPDATE public.incoming_financial_inputs
SET status = 'error',
    error_message = 'Limpo manualmente para reiniciar processo (n8n waiting)',
    updated_at = now()
WHERE status = 'waiting_user_input';