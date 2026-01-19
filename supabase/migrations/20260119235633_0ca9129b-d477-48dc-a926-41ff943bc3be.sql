-- =====================================================
-- Adicionar colunas faltantes em subcategories
-- =====================================================

ALTER TABLE public.subcategories 
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS name_es TEXT,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS source_tag_id UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Tornar category_id NOT NULL se ainda não for
ALTER TABLE public.subcategories 
ALTER COLUMN category_id SET NOT NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_subcategories_user_id ON public.subcategories(user_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_user_category ON public.subcategories(user_id, category_id) WHERE deleted_at IS NULL;

-- Constraint única
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subcategories_user_id_category_id_name_key'
  ) THEN
    ALTER TABLE public.subcategories ADD CONSTRAINT subcategories_user_id_category_id_name_key UNIQUE(user_id, category_id, name);
  END IF;
END$$;

-- =====================================================
-- Adicionar subcategory_id na tabela transactions
-- =====================================================

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories(id);

CREATE INDEX IF NOT EXISTS idx_transactions_subcategory_id ON public.transactions(subcategory_id) WHERE subcategory_id IS NOT NULL;

-- =====================================================
-- RLS para subcategories (se não existir)
-- =====================================================

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Drop políticas se existirem e recriar
DROP POLICY IF EXISTS "Users can view own subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Users can insert own subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Users can update own subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Users can delete own subcategories" ON public.subcategories;

CREATE POLICY "Users can view own subcategories"
ON public.subcategories
FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id IN (
    SELECT CASE 
      WHEN user1_id = auth.uid() THEN user2_id 
      WHEN user2_id = auth.uid() THEN user1_id 
    END
    FROM public.user_couples
    WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
      AND status = 'active'
  )
);

CREATE POLICY "Users can insert own subcategories"
ON public.subcategories
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subcategories"
ON public.subcategories
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own subcategories"
ON public.subcategories
FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- Trigger para updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_subcategories_updated_at ON public.subcategories;
CREATE TRIGGER update_subcategories_updated_at
BEFORE UPDATE ON public.subcategories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- View para subcategorias ativas
-- =====================================================

CREATE OR REPLACE VIEW public.active_subcategories AS
SELECT * FROM public.subcategories
WHERE deleted_at IS NULL;

-- =====================================================
-- Função RPC para buscar subcategorias de uma categoria
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_subcategories_for_category(p_category_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_en TEXT,
  name_es TEXT,
  color TEXT,
  icon TEXT,
  is_system BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.name_en,
    s.name_es,
    s.color,
    s.icon,
    s.is_system
  FROM public.subcategories s
  WHERE s.category_id = p_category_id
    AND s.deleted_at IS NULL
    AND (
      s.user_id = auth.uid()
      OR s.user_id IN (
        SELECT CASE 
          WHEN uc.user1_id = auth.uid() THEN uc.user2_id 
          WHEN uc.user2_id = auth.uid() THEN uc.user1_id 
        END
        FROM public.user_couples uc
        WHERE (uc.user1_id = auth.uid() OR uc.user2_id = auth.uid())
          AND uc.status = 'active'
      )
    )
  ORDER BY s.is_system DESC, s.name ASC;
END;
$$;

-- =====================================================
-- Função RPC para migrar tags existentes para subcategorias
-- =====================================================

CREATE OR REPLACE FUNCTION public.migrate_tags_to_subcategories()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_migrated_count INTEGER := 0;
  v_tag_record RECORD;
  v_new_subcategory_id UUID;
BEGIN
  -- Migrar user_category_tags para subcategories
  FOR v_tag_record IN 
    SELECT 
      uct.id as tag_id,
      uct.category_id,
      uct.tag_name as name,
      uct.color
    FROM public.user_category_tags uct
    WHERE uct.user_id = v_user_id
      AND NOT EXISTS (
        SELECT 1 FROM public.subcategories s 
        WHERE s.user_id = v_user_id 
          AND s.category_id = uct.category_id 
          AND s.name = uct.tag_name
      )
  LOOP
    INSERT INTO public.subcategories (user_id, category_id, name, color, source_tag_id)
    VALUES (v_user_id, v_tag_record.category_id, v_tag_record.name, v_tag_record.color, v_tag_record.tag_id)
    RETURNING id INTO v_new_subcategory_id;
    
    v_migrated_count := v_migrated_count + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'migrated_count', v_migrated_count
  );
END;
$$;