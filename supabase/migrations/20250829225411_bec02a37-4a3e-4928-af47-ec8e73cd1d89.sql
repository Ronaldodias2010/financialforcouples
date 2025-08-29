-- Fix search_path for the new functions

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