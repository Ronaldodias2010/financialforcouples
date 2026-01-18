-- Add 'emergency' to the account_type enum
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'emergency';

-- Create table for emergency fund reminders
CREATE TABLE public.emergency_fund_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('deposit_suggestion', 'goal_reached', 'low_balance', 'no_deposit_30_days', 'monthly_tip')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_fund_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for emergency_fund_reminders
CREATE POLICY "Users can view their own reminders"
  ON public.emergency_fund_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.emergency_fund_reminders
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON public.emergency_fund_reminders
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert reminders"
  ON public.emergency_fund_reminders
  FOR INSERT
  WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX idx_emergency_reminders_user_id ON public.emergency_fund_reminders(user_id);
CREATE INDEX idx_emergency_reminders_is_read ON public.emergency_fund_reminders(user_id, is_read) WHERE is_read = false;