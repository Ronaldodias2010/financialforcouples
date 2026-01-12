-- Etapa 1: Atualizar constraint do cash_flow_history para incluir 'card_payment'
ALTER TABLE cash_flow_history DROP CONSTRAINT IF EXISTS cash_flow_history_payment_method_check;

ALTER TABLE cash_flow_history ADD CONSTRAINT cash_flow_history_payment_method_check 
CHECK (payment_method IS NULL OR payment_method = ANY (ARRAY[
  'cash', 'pix', 'transfer', 'credit_card', 'debit_card', 
  'boleto', 'check', 'other', 'deposit', 'account_investment', 
  'account_transfer', 'payment_transfer', 'card_payment'
]));