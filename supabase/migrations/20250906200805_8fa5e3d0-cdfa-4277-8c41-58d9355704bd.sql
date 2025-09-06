-- Criar tabela para tags personalizadas dos usuários
CREATE TABLE IF NOT EXISTS public.user_category_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, category_id, tag_name)
);

-- Habilitar RLS
ALTER TABLE public.user_category_tags ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_category_tags
CREATE POLICY "Users can create their own category tags"
  ON public.user_category_tags
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own category tags"
  ON public.user_category_tags
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own category tags"
  ON public.user_category_tags
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category tags"
  ON public.user_category_tags
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_user_category_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_category_tags_updated_at
  BEFORE UPDATE ON public.user_category_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_category_tags_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_category_tags_user_id ON public.user_category_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_category_tags_category_id ON public.user_category_tags(category_id);
CREATE INDEX IF NOT EXISTS idx_user_category_tags_user_category ON public.user_category_tags(user_id, category_id);