-- Create table for tracking payment failures and grace periods
CREATE TABLE IF NOT EXISTS public.payment_failures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  failure_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  grace_period_started_at TIMESTAMP WITH TIME ZONE,
  grace_period_ends_at TIMESTAMP WITH TIME ZONE,
  downgrade_scheduled_for TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'failed' CHECK (status IN ('failed', 'grace_period', 'downgraded', 'resolved')),
  failure_reason TEXT,
  stripe_invoice_id TEXT,
  notification_emails_sent JSONB DEFAULT '[]'::jsonb,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_failures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can view payment failures" 
ON public.payment_failures 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Service role can manage payment failures" 
ON public.payment_failures 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes
CREATE INDEX idx_payment_failures_user_id ON public.payment_failures(user_id);
CREATE INDEX idx_payment_failures_status ON public.payment_failures(status);
CREATE INDEX idx_payment_failures_grace_period ON public.payment_failures(grace_period_ends_at) WHERE status = 'grace_period';

-- Create updated_at trigger
CREATE TRIGGER update_payment_failures_updated_at
BEFORE UPDATE ON public.payment_failures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for email scheduling and tracking
CREATE TABLE IF NOT EXISTS public.payment_email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('reminder_3_days', 'reminder_1_day', 'payment_failed', 'grace_period', 'downgrade_notice')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  email_address TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt',
  subscription_end_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_email_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can view email queue" 
ON public.payment_email_queue 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Service role can manage email queue" 
ON public.payment_email_queue 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes
CREATE INDEX idx_payment_email_queue_scheduled ON public.payment_email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_payment_email_queue_user_type ON public.payment_email_queue(user_id, email_type);

-- Create updated_at trigger
CREATE TRIGGER update_payment_email_queue_updated_at
BEFORE UPDATE ON public.payment_email_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();