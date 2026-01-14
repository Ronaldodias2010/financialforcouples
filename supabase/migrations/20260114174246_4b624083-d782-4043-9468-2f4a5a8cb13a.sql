-- Remover a constraint antiga e criar nova com os status adicionais
ALTER TABLE incoming_financial_inputs 
DROP CONSTRAINT IF EXISTS incoming_financial_inputs_status_check;

ALTER TABLE incoming_financial_inputs 
ADD CONSTRAINT incoming_financial_inputs_status_check 
CHECK (status IN ('received', 'waiting_user_input', 'confirmed', 'processed', 'duplicate', 'error', 'expired', 'cancelled', 'superseded'));