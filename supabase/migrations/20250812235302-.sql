-- Update RLS policies for investments table to allow couple access
DROP POLICY IF EXISTS "Users can view their own investments" ON investments;

CREATE POLICY "Users can view couple investments" 
ON investments 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM user_couples 
    WHERE status = 'active' 
    AND (
      (user1_id = auth.uid() AND user2_id = investments.user_id) OR 
      (user2_id = auth.uid() AND user1_id = investments.user_id)
    )
  )
);

-- Update RLS policies for investment_goals table to allow couple access
DROP POLICY IF EXISTS "Users can view their own investment goals" ON investment_goals;

CREATE POLICY "Users can view couple investment goals" 
ON investment_goals 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM user_couples 
    WHERE status = 'active' 
    AND (
      (user1_id = auth.uid() AND user2_id = investment_goals.user_id) OR 
      (user2_id = auth.uid() AND user1_id = investment_goals.user_id)
    )
  )
);