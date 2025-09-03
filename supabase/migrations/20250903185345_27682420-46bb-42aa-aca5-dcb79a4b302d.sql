-- Remove o ícone 💸 da categoria "Transferência entre Contas"
UPDATE public.default_categories 
SET icon = NULL
WHERE lower(name_pt) = lower('Transferência entre Contas') 
  AND category_type = 'income';

-- Também remove o ícone de todas as instâncias já criadas para os usuários
UPDATE public.categories 
SET icon = NULL
WHERE category_type = 'income' 
  AND (
    lower(name) = lower('Transferência entre Contas')
    OR lower(name) = lower('Account Transfer')
    OR lower(name) = lower('Transferencia entre Cuentas')
  );