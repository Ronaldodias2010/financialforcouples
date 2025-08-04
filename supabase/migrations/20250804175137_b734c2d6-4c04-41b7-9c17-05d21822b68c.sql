-- Create table to store stripe metrics cache
CREATE TABLE public.stripe_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active_users INTEGER NOT NULL DEFAULT 0,
  canceled_subscriptions INTEGER NOT NULL DEFAULT 0,
  failed_payments INTEGER NOT NULL DEFAULT 0,
  monthly_revenue_brl NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_metrics_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view metrics
CREATE POLICY "admins_can_view_metrics" ON public.stripe_metrics_cache
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE users.id = auth.uid() 
  AND users.email::text = ANY(ARRAY['admin@arxexperience.com.br', 'admin@example.com'])
));

-- Create policy for edge functions to update metrics
CREATE POLICY "edge_functions_can_update_metrics" ON public.stripe_metrics_cache
FOR ALL
USING (true);

-- Insert initial row
INSERT INTO public.stripe_metrics_cache (
  active_users, 
  canceled_subscriptions, 
  failed_payments, 
  monthly_revenue_brl
) VALUES (0, 0, 0, 0);