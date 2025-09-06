
-- 1) Remover vínculos de categoria em tabelas que referenciam categories.id (evita erro de FK)
UPDATE public.transactions t
SET category_id = NULL
WHERE t.category_id IN (
  SELECT id FROM public.categories WHERE category_type = 'expense'
);

UPDATE public.manual_future_expenses mfe
SET category_id = NULL
WHERE mfe.category_id IN (
  SELECT id FROM public.categories WHERE category_type = 'expense'
);

UPDATE public.future_expense_payments fep
SET category_id = NULL
WHERE fep.category_id IN (
  SELECT id FROM public.categories WHERE category_type = 'expense'
);

-- 2) Apagar TODAS as categorias de SAÍDA dos usuários
DELETE FROM public.categories
WHERE category_type = 'expense';

-- 3) Recriar exatamente as 12 categorias de SAÍDA para cada usuário
WITH users AS (
  -- Usuários conhecidos pelo app (ajuste aqui se houver outra fonte de usuários)
  SELECT DISTINCT user_id FROM public.profiles
  UNION
  SELECT DISTINCT user_id FROM public.categories -- fallback caso algum usuário não tenha profile
),
defaults AS (
  SELECT id AS default_id, name_pt, color, icon
  FROM public.default_categories
  WHERE category_type = 'expense'
)
INSERT INTO public.categories (
  user_id,
  name,
  color,
  icon,
  category_type,
  owner_user,
  default_category_id
)
SELECT
  u.user_id,
  d.name_pt,
  d.color,
  d.icon,
  'expense',
  public.determine_owner_user(u.user_id),
  d.default_id
FROM users u
CROSS JOIN defaults d;
