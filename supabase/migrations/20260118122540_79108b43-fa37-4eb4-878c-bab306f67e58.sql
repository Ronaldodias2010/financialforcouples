-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert reminders" ON public.emergency_fund_reminders;

-- Create a more restrictive INSERT policy - users can only insert reminders for themselves
CREATE POLICY "Users can insert their own reminders"
  ON public.emergency_fund_reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);