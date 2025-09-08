-- First, create cash accounts for all existing users who don't have them
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Loop through all users who don't have cash accounts
  FOR user_record IN 
    SELECT DISTINCT p.user_id
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.accounts a 
      WHERE a.user_id = p.user_id 
        AND a.is_cash_account = true
    )
  LOOP
    -- Create cash accounts for this user
    PERFORM public.create_cash_accounts_for_user(user_record.user_id);
  END LOOP;
END $$;

-- Modify the existing trigger function to also create cash accounts for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_lang TEXT;
BEGIN
  -- Try to get language from user profile
  SELECT 
    CASE 
      WHEN raw_user_meta_data->>'preferred_language' IS NOT NULL 
      THEN raw_user_meta_data->>'preferred_language'
      ELSE 'pt'
    END INTO user_lang
  FROM auth.users 
  WHERE id = NEW.user_id;
  
  -- Create default categories
  PERFORM public.create_default_categories_for_user(NEW.user_id, COALESCE(user_lang, 'pt'));
  
  -- Create cash accounts for the new user
  PERFORM public.create_cash_accounts_for_user(NEW.user_id);
  
  RETURN NEW;
END;
$function$;