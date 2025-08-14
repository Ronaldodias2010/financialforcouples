-- Update the SELECT policy for mileage_goals to allow viewing couple's goals
DROP POLICY IF EXISTS "Users can view their own mileage goals" ON public.mileage_goals;

CREATE POLICY "Users can view couple mileage goals" 
ON public.mileage_goals 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1
    FROM user_couples
    WHERE status = 'active'
    AND (
      (user1_id = auth.uid() AND user2_id = mileage_goals.user_id) OR
      (user2_id = auth.uid() AND user1_id = mileage_goals.user_id)
    )
  ))
);