-- Corrigir política para permitir que admins vejam todos os registros de subscribers
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;

-- Criar política mais simples que funciona
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (
  (user_id = auth.uid()) OR 
  (email = auth.email()) OR
  (auth.email() = 'admin@arxexperience.com.br') OR
  (auth.email() = 'admin@example.com')
);