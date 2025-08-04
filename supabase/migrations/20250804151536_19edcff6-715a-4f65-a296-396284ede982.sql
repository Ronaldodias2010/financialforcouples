-- Create table for manual premium access
CREATE TABLE public.manual_premium_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  temp_password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_by_admin_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint to ensure end_date is not more than 90 days from start_date
  CONSTRAINT max_90_days CHECK (end_date <= start_date + INTERVAL '90 days'),
  -- Constraint to ensure end_date is after start_date
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Enable RLS
ALTER TABLE public.manual_premium_access ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Only admins can view manual premium access" 
ON public.manual_premium_access 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@arxexperience.com.br', 'admin@example.com')
  )
);

CREATE POLICY "Only admins can create manual premium access" 
ON public.manual_premium_access 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@arxexperience.com.br', 'admin@example.com')
  )
);

CREATE POLICY "Only admins can update manual premium access" 
ON public.manual_premium_access 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@arxexperience.com.br', 'admin@example.com')
  )
);

-- Create function to automatically expire manual premium access
CREATE OR REPLACE FUNCTION public.check_manual_premium_expiration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update expired manual premium access
  UPDATE public.manual_premium_access
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND end_date < CURRENT_DATE;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_manual_premium_access_updated_at
  BEFORE UPDATE ON public.manual_premium_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_manual_premium_access_user_id ON public.manual_premium_access(user_id);
CREATE INDEX idx_manual_premium_access_status ON public.manual_premium_access(status);
CREATE INDEX idx_manual_premium_access_dates ON public.manual_premium_access(start_date, end_date);