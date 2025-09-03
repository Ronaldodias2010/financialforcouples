
-- 1) Garantir que a categoria exista em default_categories (idempotente)
INSERT INTO public.default_categories (
  name_pt, name_en, name_es, color, icon, category_type,
  description_pt, description_en, description_es
)
SELECT
  'Transferência entre Contas',
  'Account Transfer',
  'Transferencia entre Cuentas',
  '#10b981',
  '💸',
  'income',
  'Transferência de dinheiro entre contas próprias',
  'Money transfer between own accounts',
  'Transferencia de dinero entre cuentas propias'
WHERE NOT EXISTS (
  SELECT 1 FROM public.default_categories
  WHERE lower(name_pt) = lower('Transferência entre Contas')
    AND category_type = 'income'
);

-- 2) Inserir para todos os usuários que ainda não possuem a categoria em public.categories
--    Evita duplicar se o usuário já tiver a categoria equivalente em PT/EN/ES
INSERT INTO public.categories (user_id, name, color, icon, category_type, owner_user)
SELECT
  p.user_id,
  'Transferência entre Contas' AS name,
  '#10b981' AS color,
  '💸' AS icon,
  'income' AS category_type,
  public.determine_owner_user(p.user_id) AS owner_user
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.categories c
  WHERE c.user_id = p.user_id
    AND c.category_type = 'income'
    AND (
      lower(c.name) = lower('Transferência entre Contas')
      OR lower(c.name) = 'transferencia entre contas'
      OR lower(c.name) = lower('Account Transfer')
      OR lower(c.name) = lower('Transferencia entre Cuentas')
    )
);
