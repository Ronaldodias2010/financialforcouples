-- Add language preference and email notification tracking for manual premium access system

-- Add language preference to manual_premium_access table
ALTER TABLE public.manual_premium_access 
ADD COLUMN language_preference text DEFAULT 'pt' CHECK (language_preference IN ('pt', 'en', 'es'));

-- Create table to track sent expiration emails (prevent duplicates)
CREATE TABLE IF NOT EXISTS public.premium_expiration_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  warning_type text NOT NULL CHECK (warning_type IN ('warning_3_days', 'warning_1_day', 'grace_period')),
  expiration_date date NOT NULL,
  language text NOT NULL DEFAULT 'pt',
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.premium_expiration_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for the new table
CREATE POLICY "Only admins can view expiration emails" 
ON public.premium_expiration_emails 
FOR SELECT 
USING (public.is_admin_user());

CREATE POLICY "Service role can manage expiration emails" 
ON public.premium_expiration_emails 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to get manual premium access users nearing expiration
CREATE OR REPLACE FUNCTION public.get_users_near_expiration(days_before integer)
RETURNS TABLE(
  user_id uuid,
  email text,
  end_date date,
  language_preference text,
  days_until_expiration integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    mpa.user_id,
    mpa.email,
    mpa.end_date,
    COALESCE(mpa.language_preference, 
             p.display_name, -- Try to get from profile metadata
             'pt') as language_preference,
    (mpa.end_date - CURRENT_DATE) as days_until_expiration
  FROM public.manual_premium_access mpa
  LEFT JOIN public.profiles p ON p.user_id = mpa.user_id
  WHERE mpa.status = 'active'
    AND mpa.end_date - CURRENT_DATE = days_before
    AND NOT EXISTS (
      SELECT 1 FROM public.premium_expiration_emails pee
      WHERE pee.user_id = mpa.user_id 
        AND pee.expiration_date = mpa.end_date
        AND pee.warning_type = CASE 
          WHEN days_before = 3 THEN 'warning_3_days'
          WHEN days_before = 1 THEN 'warning_1_day'
          WHEN days_before = 0 THEN 'grace_period'
        END
    );
$function$;

-- Create function to mark expiration email as sent
CREATE OR REPLACE FUNCTION public.mark_expiration_email_sent(
  p_user_id uuid,
  p_email text,
  p_warning_type text,
  p_expiration_date date,
  p_language text DEFAULT 'pt'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.premium_expiration_emails (
    user_id,
    email,
    warning_type,
    expiration_date,
    language
  ) VALUES (
    p_user_id,
    p_email,
    p_warning_type,
    p_expiration_date,
    p_language
  );
END;
$function$;