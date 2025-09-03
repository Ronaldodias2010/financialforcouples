-- Adicionar categoria fixa "Transferência entre Contas" como receita para todos os usuários
INSERT INTO public.default_categories (
  name_pt, 
  name_en, 
  name_es, 
  color, 
  icon, 
  category_type,
  description_pt,
  description_en,
  description_es
) VALUES (
  'Transferência entre Contas',
  'Account Transfer', 
  'Transferencia entre Cuentas',
  '#10b981',
  '💸',
  'income',
  'Transferência de dinheiro entre contas próprias',
  'Money transfer between own accounts',
  'Transferencia de dinero entre cuentas propias'
)
ON CONFLICT DO NOTHING;