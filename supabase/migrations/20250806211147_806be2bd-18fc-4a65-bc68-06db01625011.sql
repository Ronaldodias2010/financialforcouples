-- Atualizar política para permitir que admins vejam todos os registros de subscribers
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;

CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (
  (user_id = auth.uid()) OR 
  (email = auth.email()) OR
  (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email IN ('admin@arxexperience.com.br', 'admin@example.com')
  ))
);