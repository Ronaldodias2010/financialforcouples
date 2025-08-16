-- Corrigir problema de segurança: Habilitar RLS na tabela default_categories
ALTER TABLE public.default_categories ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que todos vejam as categorias padrão (são dados do sistema)
CREATE POLICY "Default categories are viewable by all authenticated users" 
ON public.default_categories 
FOR SELECT 
TO authenticated
USING (true);

-- Política para negação de acesso anônimo
CREATE POLICY "Deny anonymous access to default_categories" 
ON public.default_categories 
FOR ALL 
TO anon 
USING (false) 
WITH CHECK (false);