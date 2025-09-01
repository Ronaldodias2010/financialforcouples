-- Corrigir problemas de segurança detectados pelo linter

-- 1. Corrigir functions sem search_path adequado
CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS TRIGGER AS $$
DECLARE
  user_lang TEXT;
BEGIN
  -- Tentar obter idioma do perfil do usuário
  SELECT 
    CASE 
      WHEN raw_user_meta_data->>'preferred_language' IS NOT NULL 
      THEN raw_user_meta_data->>'preferred_language'
      ELSE 'pt'
    END INTO user_lang
  FROM auth.users 
  WHERE id = NEW.user_id;
  
  -- Criar categorias padrão
  PERFORM public.create_default_categories_for_user(NEW.user_id, COALESCE(user_lang, 'pt'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Corrigir função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, phone_number)
    VALUES (
        NEW.id, 
        COALESCE(
            NEW.raw_user_meta_data ->> 'display_name',
            NEW.raw_user_meta_data ->> 'full_name', 
            NEW.raw_user_meta_data ->> 'name',
            NEW.email
        ),
        NEW.raw_user_meta_data ->> 'phone_number'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Corrigir função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;