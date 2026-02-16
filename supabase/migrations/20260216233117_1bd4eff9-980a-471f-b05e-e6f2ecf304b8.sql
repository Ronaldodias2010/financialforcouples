-- Renomear a default category de "Quitação Dívida Crédito" para "Pagamento de Cartão de Crédito"
UPDATE default_categories 
SET name_pt = 'Pagamento de Cartão de Crédito', 
    name_en = 'Credit Card Payment', 
    name_es = 'Pago de Tarjeta de Crédito'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Atualizar todas as categorias de usuários vinculadas a essa default category
UPDATE categories 
SET name = 'Pagamento de Cartão de Crédito'
WHERE default_category_id = 'a0000000-0000-0000-0000-000000000001';