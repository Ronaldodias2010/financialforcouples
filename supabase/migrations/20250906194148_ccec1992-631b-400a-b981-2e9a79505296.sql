
-- 1) Relações e índices em category_tag_relations
ALTER TABLE public.category_tag_relations
  ADD CONSTRAINT IF NOT EXISTS fk_ctr_category
    FOREIGN KEY (category_id) REFERENCES public.default_categories(id) ON DELETE CASCADE,
  ADD CONSTRAINT IF NOT EXISTS fk_ctr_tag
    FOREIGN KEY (tag_id) REFERENCES public.category_tags(id) ON DELETE CASCADE;

-- Unique para permitir ON CONFLICT (category_id, tag_id)
ALTER TABLE public.category_tag_relations
  ADD CONSTRAINT IF NOT EXISTS uq_ctr_category_tag UNIQUE (category_id, tag_id);

-- 2) Coluna para mapear categorias do usuário -> categoria padrão
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS default_category_id uuid;

ALTER TABLE public.categories
  ADD CONSTRAINT IF NOT EXISTS fk_categories_default_category
    FOREIGN KEY (default_category_id) REFERENCES public.default_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_default_category ON public.categories(default_category_id);

-- Índice útil para tags em transações (já existe a coluna tag_id)
CREATE INDEX IF NOT EXISTS idx_transactions_tag_id ON public.transactions(tag_id);

-- 3) Trigger para setar default_category_id automaticamente conforme o nome
CREATE OR REPLACE FUNCTION public.set_default_category_id_on_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_food uuid;
  v_health uuid;
BEGIN
  IF NEW.default_category_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_food FROM public.default_categories WHERE name_pt = 'Alimentação' LIMIT 1;
  SELECT id INTO v_health FROM public.default_categories WHERE name_pt = 'Saúde' LIMIT 1;

  IF v_food IS NULL OR v_health IS NULL THEN
    RETURN NEW; -- segurança: não faz nada se a base padrão não estiver disponível
  END IF;

  IF lower(public.normalize_text_simple(NEW.name)) IN ('alimentação','alimentacao','alimentación','restaurante','supermercado') THEN
    NEW.default_category_id := v_food;
  ELSIF lower(public.normalize_text_simple(NEW.name)) IN ('saúde','saude','salud','academia') THEN
    NEW.default_category_id := v_health;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_default_category_id_on_categories ON public.categories;
CREATE TRIGGER trg_set_default_category_id_on_categories
BEFORE INSERT OR UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.set_default_category_id_on_categories();

-- 4) Backfill do mapeamento e consolidação de dados
DO $$
DECLARE
  v_food uuid;
  v_health uuid;
  v_tag_supermercado uuid;
  v_tag_restaurante uuid;
  v_tag_academia uuid;
BEGIN
  -- IDs das categorias padrão
  SELECT id INTO v_food FROM public.default_categories WHERE name_pt = 'Alimentação' LIMIT 1;
  SELECT id INTO v_health FROM public.default_categories WHERE name_pt = 'Saúde' LIMIT 1;

  -- IDs das tags
  SELECT id INTO v_tag_supermercado FROM public.category_tags WHERE name_pt = 'Supermercado' LIMIT 1;
  SELECT id INTO v_tag_restaurante FROM public.category_tags WHERE name_pt = 'Restaurante' LIMIT 1;
  SELECT id INTO v_tag_academia FROM public.category_tags WHERE name_pt = 'Academia' LIMIT 1;

  -- Garantir vínculos das tags com as categorias padrão
  IF v_food IS NOT NULL THEN
    INSERT INTO public.category_tag_relations(category_id, tag_id)
    SELECT v_food, id FROM public.category_tags
    WHERE lower(name_pt) IN ('supermercado','padaria','restaurante','lanchonete','delivery','feira','café','cafe','fast food')
    ON CONFLICT (category_id, tag_id) DO NOTHING;
  END IF;

  IF v_health IS NOT NULL AND v_tag_academia IS NOT NULL THEN
    INSERT INTO public.category_tag_relations(category_id, tag_id)
    VALUES (v_health, v_tag_academia)
    ON CONFLICT (category_id, tag_id) DO NOTHING;
  END IF;

  -- Backfill default_category_id conforme nomes existentes
  IF v_food IS NOT NULL THEN
    UPDATE public.categories
    SET default_category_id = v_food
    WHERE lower(public.normalize_text_simple(name)) IN ('alimentação','alimentacao','alimentación','restaurante','supermercado')
      AND (default_category_id IS NULL OR default_category_id <> v_food);
  END IF;

  IF v_health IS NOT NULL THEN
    UPDATE public.categories
    SET default_category_id = v_health
    WHERE lower(public.normalize_text_simple(name)) IN ('saúde','saude','salud','academia')
      AND (default_category_id IS NULL OR default_category_id <> v_health);
  END IF;

  -- Criar categoria-mãe se o usuário tiver subcategoria mas não tiver a mãe
  IF v_food IS NOT NULL THEN
    INSERT INTO public.categories (user_id, name, category_type, color, icon, owner_user, default_category_id)
    SELECT DISTINCT c.user_id, 'Alimentação', 'expense', '#10b981', 'utensils', public.determine_owner_user(c.user_id), v_food
    FROM public.categories c
    WHERE lower(public.normalize_text_simple(c.name)) IN ('restaurante','supermercado')
      AND NOT EXISTS (
        SELECT 1 FROM public.categories c2
        WHERE c2.user_id = c.user_id
          AND lower(public.normalize_text_simple(c2.name)) IN ('alimentação','alimentacao','alimentación')
      );
  END IF;

  IF v_health IS NOT NULL THEN
    INSERT INTO public.categories (user_id, name, category_type, color, icon, owner_user, default_category_id)
    SELECT DISTINCT c.user_id, 'Saúde', 'expense', '#ef4444', 'activity', public.determine_owner_user(c.user_id), v_health
    FROM public.categories c
    WHERE lower(public.normalize_text_simple(c.name)) IN ('academia')
      AND NOT EXISTS (
        SELECT 1 FROM public.categories c2
        WHERE c2.user_id = c.user_id
          AND lower(public.normalize_text_simple(c2.name)) IN ('saúde','saude','salud')
      );
  END IF;

  -- Atualizar transações: Restaurante -> Alimentação (tag Restaurante)
  IF v_tag_restaurante IS NOT NULL THEN
    WITH resto AS (
      SELECT id AS old_cat_id, user_id
      FROM public.categories
      WHERE lower(public.normalize_text_simple(name)) = 'restaurante'
    ), food AS (
      SELECT user_id, id AS food_cat_id
      FROM public.categories
      WHERE lower(public.normalize_text_simple(name)) IN ('alimentação','alimentacao','alimentación')
    )
    UPDATE public.transactions t
    SET category_id = f.food_cat_id,
        tag_id = v_tag_restaurante,
        subcategory = 'Restaurante'
    FROM resto r
    JOIN food f ON f.user_id = r.user_id
    WHERE t.category_id = r.old_cat_id;
    
    -- Também mover em tabelas de despesas futuras
    UPDATE public.manual_future_expenses mfe
    SET category_id = f.food_cat_id
    FROM resto r
    JOIN food f ON f.user_id = r.user_id
    WHERE mfe.category_id = r.old_cat_id;

    UPDATE public.future_expense_payments fep
    SET category_id = f.food_cat_id
    FROM resto r
    JOIN food f ON f.user_id = r.user_id
    WHERE fep.category_id = r.old_cat_id;
  END IF;

  -- Atualizar transações: Supermercado -> Alimentação (tag Supermercado)
  IF v_tag_supermercado IS NOT NULL THEN
    WITH super AS (
      SELECT id AS old_cat_id, user_id
      FROM public.categories
      WHERE lower(public.normalize_text_simple(name)) = 'supermercado'
    ), food AS (
      SELECT user_id, id AS food_cat_id
      FROM public.categories
      WHERE lower(public.normalize_text_simple(name)) IN ('alimentação','alimentacao','alimentación')
    )
    UPDATE public.transactions t
    SET category_id = f.food_cat_id,
        tag_id = v_tag_supermercado,
        subcategory = 'Supermercado'
    FROM super s
    JOIN food f ON f.user_id = s.user_id
    WHERE t.category_id = s.old_cat_id;

    UPDATE public.manual_future_expenses mfe
    SET category_id = f.food_cat_id
    FROM super s
    JOIN food f ON f.user_id = s.user_id
    WHERE mfe.category_id = s.old_cat_id;

    UPDATE public.future_expense_payments fep
    SET category_id = f.food_cat_id
    FROM super s
    JOIN food f ON f.user_id = s.user_id
    WHERE fep.category_id = s.old_cat_id;
  END IF;

  -- Atualizar transações: Academia -> Saúde (tag Academia)
  IF v_tag_academia IS NOT NULL THEN
    WITH acad AS (
      SELECT id AS old_cat_id, user_id
      FROM public.categories
      WHERE lower(public.normalize_text_simple(name)) = 'academia'
    ), health AS (
      SELECT user_id, id AS health_cat_id
      FROM public.categories
      WHERE lower(public.normalize_text_simple(name)) IN ('saúde','saude','salud')
    )
    UPDATE public.transactions t
    SET category_id = h.health_cat_id,
        tag_id = v_tag_academia,
        subcategory = 'Academia'
    FROM acad a
    JOIN health h ON h.user_id = a.user_id
    WHERE t.category_id = a.old_cat_id;

    UPDATE public.manual_future_expenses mfe
    SET category_id = h.health_cat_id
    FROM acad a
    JOIN health h ON h.user_id = a.user_id
    WHERE mfe.category_id = a.old_cat_id;

    UPDATE public.future_expense_payments fep
    SET category_id = h.health_cat_id
    FROM acad a
    JOIN health h ON h.user_id = a.user_id
    WHERE fep.category_id = a.old_cat_id;
  END IF;

  -- Remover categorias redundantes se não tiverem mais referências
  DELETE FROM public.categories c
  WHERE lower(public.normalize_text_simple(c.name)) IN ('restaurante','supermercado','academia')
    AND NOT EXISTS (SELECT 1 FROM public.transactions t WHERE t.category_id = c.id)
    AND NOT EXISTS (SELECT 1 FROM public.manual_future_expenses mfe WHERE mfe.category_id = c.id)
    AND NOT EXISTS (SELECT 1 FROM public.future_expense_payments fep WHERE fep.category_id = c.id);
END;
$$;
