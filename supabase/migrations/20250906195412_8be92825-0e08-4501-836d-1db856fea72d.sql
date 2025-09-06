
-- 1) Adicionar FKs que habilitam o embed nas queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'category_tag_relations_category_id_fkey'
  ) THEN
    ALTER TABLE public.category_tag_relations
      ADD CONSTRAINT category_tag_relations_category_id_fkey
      FOREIGN KEY (category_id)
      REFERENCES public.default_categories(id)
      ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'category_tag_relations_tag_id_fkey'
  ) THEN
    ALTER TABLE public.category_tag_relations
      ADD CONSTRAINT category_tag_relations_tag_id_fkey
      FOREIGN KEY (tag_id)
      REFERENCES public.category_tags(id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- 2) Garantir unicidade e performance
CREATE UNIQUE INDEX IF NOT EXISTS uq_category_tag_relations_pair
  ON public.category_tag_relations (category_id, tag_id);

CREATE INDEX IF NOT EXISTS idx_category_tag_relations_category_id
  ON public.category_tag_relations (category_id);

CREATE INDEX IF NOT EXISTS idx_category_tag_relations_tag_id
  ON public.category_tag_relations (tag_id);

-- 3) (Opcional, recomendado) Permitir SELECT público para evitar erros quando o usuário não está logado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'category_tag_relations'
      AND policyname = 'Public can view tag relations'
  ) THEN
    CREATE POLICY "Public can view tag relations"
      ON public.category_tag_relations
      FOR SELECT
      TO public
      USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'category_tags'
      AND policyname = 'Public can view tags'
  ) THEN
    CREATE POLICY "Public can view tags"
      ON public.category_tags
      FOR SELECT
      TO public
      USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'default_categories'
      AND policyname = 'Public can view default categories'
  ) THEN
    CREATE POLICY "Public can view default categories"
      ON public.default_categories
      FOR SELECT
      TO public
      USING (true);
  END IF;
END$$;
