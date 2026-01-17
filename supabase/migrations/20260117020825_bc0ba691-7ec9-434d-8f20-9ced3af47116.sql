-- Corrigir RLS para permitir que parceiros (casal) possam atualizar/pagar despesas um do outro

-- Remover política antiga de UPDATE
DROP POLICY IF EXISTS "Users can update their own manual future expenses" ON public.manual_future_expenses;

-- Criar nova política que permite UPDATE para o próprio usuário OU parceiro do casal
CREATE POLICY "Users can update their own or partner manual future expenses"
ON public.manual_future_expenses
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM user_couples
    WHERE user_couples.status = 'active'
    AND (
      (user_couples.user1_id = auth.uid() AND user_couples.user2_id = manual_future_expenses.user_id)
      OR 
      (user_couples.user2_id = auth.uid() AND user_couples.user1_id = manual_future_expenses.user_id)
    )
  )
)
WITH CHECK (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM user_couples
    WHERE user_couples.status = 'active'
    AND (
      (user_couples.user1_id = auth.uid() AND user_couples.user2_id = manual_future_expenses.user_id)
      OR 
      (user_couples.user2_id = auth.uid() AND user_couples.user1_id = manual_future_expenses.user_id)
    )
  )
);

-- Também atualizar DELETE para permitir parceiros
DROP POLICY IF EXISTS "Users can delete their own manual future expenses" ON public.manual_future_expenses;

CREATE POLICY "Users can delete their own or partner manual future expenses"
ON public.manual_future_expenses
FOR DELETE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM user_couples
    WHERE user_couples.status = 'active'
    AND (
      (user_couples.user1_id = auth.uid() AND user_couples.user2_id = manual_future_expenses.user_id)
      OR 
      (user_couples.user2_id = auth.uid() AND user_couples.user1_id = manual_future_expenses.user_id)
    )
  )
);