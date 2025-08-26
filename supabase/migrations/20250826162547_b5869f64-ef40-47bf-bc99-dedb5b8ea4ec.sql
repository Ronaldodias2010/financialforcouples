-- Create AI usage tracking table
CREATE TABLE public.ai_usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  requests_count INTEGER NOT NULL DEFAULT 0,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  estimated_cost_brl NUMERIC(10,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create AI usage limits table
CREATE TABLE public.ai_usage_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_tier TEXT NOT NULL,
  daily_requests_limit INTEGER NOT NULL DEFAULT 0,
  daily_tokens_limit INTEGER NOT NULL DEFAULT 0,
  daily_cost_limit_brl NUMERIC(10,4) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subscription_tier)
);

-- Enable RLS on both tables
ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;

-- Policies for ai_usage_tracking
CREATE POLICY "Users can view their own AI usage" 
ON public.ai_usage_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view couple AI usage" 
ON public.ai_usage_tracking 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM user_couples 
    WHERE status = 'active' 
    AND ((user1_id = auth.uid() AND user2_id = ai_usage_tracking.user_id) 
    OR (user2_id = auth.uid() AND user1_id = ai_usage_tracking.user_id))
  )
);

CREATE POLICY "Service role can manage AI usage tracking" 
ON public.ai_usage_tracking 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all AI usage" 
ON public.ai_usage_tracking 
FOR SELECT 
USING (is_admin_user());

-- Policies for ai_usage_limits
CREATE POLICY "Authenticated users can view AI limits" 
ON public.ai_usage_limits 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage AI limits" 
ON public.ai_usage_limits 
FOR ALL 
USING (is_admin_user());

-- Insert default limits
INSERT INTO public.ai_usage_limits (subscription_tier, daily_requests_limit, daily_tokens_limit, daily_cost_limit_brl) 
VALUES 
  ('essential', 0, 0, 0.00),
  ('premium', 100, 25000, 1.00);

-- Create function to get current usage
CREATE OR REPLACE FUNCTION public.get_user_daily_ai_usage(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(requests_count INTEGER, tokens_used INTEGER, estimated_cost_brl NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(requests_count, 0) as requests_count,
    COALESCE(tokens_used, 0) as tokens_used,
    COALESCE(estimated_cost_brl, 0) as estimated_cost_brl
  FROM ai_usage_tracking 
  WHERE user_id = p_user_id AND date = p_date
  UNION ALL
  SELECT 0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM ai_usage_tracking 
    WHERE user_id = p_user_id AND date = p_date
  )
  LIMIT 1;
$$;

-- Create function to update usage
CREATE OR REPLACE FUNCTION public.update_ai_usage(
  p_user_id UUID, 
  p_tokens_used INTEGER, 
  p_estimated_cost_brl NUMERIC DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.ai_usage_tracking (user_id, date, requests_count, tokens_used, estimated_cost_brl)
  VALUES (p_user_id, CURRENT_DATE, 1, p_tokens_used, p_estimated_cost_brl)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    requests_count = ai_usage_tracking.requests_count + 1,
    tokens_used = ai_usage_tracking.tokens_used + p_tokens_used,
    estimated_cost_brl = ai_usage_tracking.estimated_cost_brl + p_estimated_cost_brl,
    updated_at = now();
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_ai_usage_tracking_updated_at
  BEFORE UPDATE ON public.ai_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_usage_limits_updated_at
  BEFORE UPDATE ON public.ai_usage_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();