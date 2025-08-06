-- Atualizar políticas RLS para permitir compartilhamento de dados entre casais

-- 1. Transactions - permitir visualizar transações do casal
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view couple transactions" ON public.transactions
FOR SELECT USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_couples 
    WHERE status = 'active' 
    AND ((user1_id = auth.uid() AND user2_id = transactions.user_id) 
         OR (user2_id = auth.uid() AND user1_id = transactions.user_id))
  )
);

-- 2. Cards - permitir visualizar cartões do casal  
DROP POLICY IF EXISTS "Users can view their own cards" ON public.cards;
CREATE POLICY "Users can view couple cards" ON public.cards
FOR SELECT USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_couples 
    WHERE status = 'active' 
    AND ((user1_id = auth.uid() AND user2_id = cards.user_id) 
         OR (user2_id = auth.uid() AND user1_id = cards.user_id))
  )
);

-- 3. Accounts - permitir visualizar contas do casal
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
CREATE POLICY "Users can view couple accounts" ON public.accounts
FOR SELECT USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_couples 
    WHERE status = 'active' 
    AND ((user1_id = auth.uid() AND user2_id = accounts.user_id) 
         OR (user2_id = auth.uid() AND user1_id = accounts.user_id))
  )
);

-- 4. Categories - permitir visualizar categorias do casal
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
CREATE POLICY "Users can view couple categories" ON public.categories
FOR SELECT USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_couples 
    WHERE status = 'active' 
    AND ((user1_id = auth.uid() AND user2_id = categories.user_id) 
         OR (user2_id = auth.uid() AND user1_id = categories.user_id))
  )
);

-- 5. Profiles - permitir visualizar perfil do parceiro
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view couple profiles" ON public.profiles
FOR SELECT USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_couples 
    WHERE status = 'active' 
    AND ((user1_id = auth.uid() AND user2_id = profiles.user_id) 
         OR (user2_id = auth.uid() AND user1_id = profiles.user_id))
  )
);