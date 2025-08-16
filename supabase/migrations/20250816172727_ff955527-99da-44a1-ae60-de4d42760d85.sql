-- Criar função para adicionar categorias padrão para usuários existentes que não têm
CREATE OR REPLACE FUNCTION public.populate_missing_default_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_record RECORD;
  user_lang TEXT;
BEGIN
  -- Para cada usuário que não tem categorias ou tem menos de 30 categorias
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data, COALESCE(c.count, 0) as category_count
    FROM auth.users u
    LEFT JOIN (
      SELECT user_id, count(*) as count 
      FROM public.categories 
      GROUP BY user_id
    ) c ON u.id = c.user_id
    WHERE COALESCE(c.count, 0) < 30
  LOOP
    -- Determinar idioma do usuário
    user_lang := COALESCE(
      user_record.raw_user_meta_data->>'preferred_language',
      'pt'
    );
    
    -- Limpar categorias existentes do usuário para evitar duplicatas
    DELETE FROM public.categories WHERE user_id = user_record.id;
    
    -- Criar categorias padrão
    PERFORM public.create_default_categories_for_user(user_record.id, user_lang);
    
    RAISE NOTICE 'Categorias criadas para usuário: %', user_record.email;
  END LOOP;
END;
$function$;

-- Executar a função para popular categorias para usuários existentes
SELECT public.populate_missing_default_categories();

-- Remover a função temporária
DROP FUNCTION public.populate_missing_default_categories();