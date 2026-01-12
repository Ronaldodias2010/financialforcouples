-- Atualizar default_categories
UPDATE default_categories 
SET 
  name_pt = 'Quitação Dívida Crédito',
  name_en = 'Credit Debt Settlement',
  name_es = 'Liquidación Deuda Crédito',
  description_pt = 'Pagamento de fatura do cartão de crédito',
  description_en = 'Credit card bill payment',
  description_es = 'Pago de factura de tarjeta de crédito'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Atualizar categorias de usuários
UPDATE categories 
SET name = 'Quitação Dívida Crédito'
WHERE name IN ('Pagamento de Cartão de Crédito', 'Credit Card Payment');