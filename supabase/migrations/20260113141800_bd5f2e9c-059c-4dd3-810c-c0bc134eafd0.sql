-- Limpar registros travados em waiting_user_input para reiniciar o processo
UPDATE incoming_financial_inputs 
SET status = 'error', 
    error_message = 'Limpo manualmente para reiniciar processo',
    updated_at = now()
WHERE status = 'waiting_user_input';