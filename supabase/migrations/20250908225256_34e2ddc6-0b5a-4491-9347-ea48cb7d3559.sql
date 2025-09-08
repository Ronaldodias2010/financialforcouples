-- Adicionar categoria "Saque" para todos os usuários e remover categoria "(Teste)"

-- Primeiro, adicionar "Saque" nas categorias padrão se não existir
INSERT INTO public.default_categories (
  name_pt, name_en, name_es, 
  description_pt, description_en, description_es,
  category_type, color, icon
) VALUES (
  'Saque', 'Withdrawal', 'Retiro',
  'Saques em dinheiro', 'Cash withdrawals', 'Retiros en efectivo',
  'expense', '#ef4444', 'Banknote'
) ON CONFLICT DO NOTHING;

-- Remover categoria "(Teste)" das categorias padrão se existir
DELETE FROM public.default_categories 
WHERE name_pt = '(Teste)' OR name_en = '(Teste)' OR name_es = '(Teste)';

-- Remover categoria "(Teste)" de todos os usuários
DELETE FROM public.categories 
WHERE name ILIKE '%teste%' OR name = '(Teste)';

-- Adicionar categoria "Saque" para todos os usuários existentes que não têm
WITH user_languages AS (
  SELECT 
    p.user_id,
    COALESCE(
      CASE 
        WHEN u.raw_user_meta_data->>'preferred_language' IS NOT NULL 
        THEN u.raw_user_meta_data->>'preferred_language'
        ELSE 'pt'
      END, 'pt'
    ) as user_lang
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
),
saque_category AS (
  SELECT * FROM public.default_categories 
  WHERE name_pt = 'Saque' 
  LIMIT 1
)
INSERT INTO public.categories (
  name, color, icon, category_type, owner_user, user_id, default_category_id
)
SELECT 
  CASE 
    WHEN ul.user_lang = 'en' THEN sc.name_en
    WHEN ul.user_lang = 'es' THEN sc.name_es
    ELSE sc.name_pt
  END as name,
  sc.color,
  sc.icon,
  sc.category_type,
  'user1',
  ul.user_id,
  sc.id
FROM user_languages ul
CROSS JOIN saque_category sc
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c
  WHERE c.user_id = ul.user_id 
    AND c.category_type = 'expense'
    AND (
      lower(trim(c.name)) = 'saque' OR 
      lower(trim(c.name)) = 'withdrawal' OR 
      lower(trim(c.name)) = 'retiro'
    )
);