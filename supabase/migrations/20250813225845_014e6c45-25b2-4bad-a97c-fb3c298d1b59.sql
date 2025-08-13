-- Update RLS policy for recurring_expenses to allow couple access
DROP POLICY IF EXISTS "Users can view their own recurring expenses" ON public.recurring_expenses;

CREATE POLICY "Users can view couple recurring expenses" 
ON public.recurring_expenses 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM user_couples 
    WHERE status = 'active' 
    AND (
      (user1_id = auth.uid() AND user2_id = recurring_expenses.user_id) 
      OR (user2_id = auth.uid() AND user1_id = recurring_expenses.user_id)
    )
  )
);