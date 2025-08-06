-- Adicionar política para que admins possam ver todos os perfis
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.email() = 'admin@arxexperience.com.br' OR 
  auth.email() = 'admin@example.com'
);