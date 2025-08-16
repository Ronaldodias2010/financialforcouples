-- Criar categorias padrão mais completas para todos os usuários
-- Adicionar uma tabela de categorias padrão do sistema

CREATE TABLE public.default_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,  
  name_es TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT,
  category_type TEXT NOT NULL CHECK (category_type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir categorias padrão de entrada (receitas)
INSERT INTO public.default_categories (name_pt, name_en, name_es, category_type, color) VALUES
('Salário', 'Salary', 'Salario', 'income', '#10b981'),
('Comissão', 'Commission', 'Comisión', 'income', '#10b981'),
('Renda Extra', 'Extra Income', 'Ingresos Extra', 'income', '#10b981'),
('Aposentadoria', 'Retirement', 'Jubilación', 'income', '#10b981'),
('Pensão', 'Pension', 'Pensión', 'income', '#10b981'),
('Investimento', 'Investment', 'Inversión', 'income', '#10b981'),
('Dividendo', 'Dividend', 'Dividendo', 'income', '#10b981'),
('Bônus', 'Bonus', 'Bonificación', 'income', '#10b981'),
('Freelance', 'Freelance', 'Freelance', 'income', '#10b981'),
('Reembolso', 'Refund', 'Reembolso', 'income', '#10b981'),
('Presente', 'Gift', 'Regalo', 'income', '#10b981');

-- Inserir categorias padrão de saída (despesas)
INSERT INTO public.default_categories (name_pt, name_en, name_es, category_type, color) VALUES
('Alimentação', 'Food', 'Comida', 'expense', '#ef4444'),
('Combustível', 'Fuel', 'Combustible', 'expense', '#ef4444'),
('Saúde', 'Health', 'Salud', 'expense', '#ef4444'),
('Educação', 'Education', 'Educación', 'expense', '#ef4444'),
('Vestuário', 'Clothing', 'Ropa', 'expense', '#ef4444'),
('Viagem', 'Travel', 'Viaje', 'expense', '#ef4444'),
('Transporte', 'Transport', 'Transporte', 'expense', '#ef4444'),
('Moradia', 'Housing', 'Vivienda', 'expense', '#ef4444'),
('Entretenimento', 'Entertainment', 'Entretenimiento', 'expense', '#ef4444'),
('Compras', 'Shopping', 'Compras', 'expense', '#ef4444'),
('Academia', 'Gym', 'Gimnasio', 'expense', '#ef4444'),
('Seguro', 'Insurance', 'Seguro', 'expense', '#ef4444'),
('Impostos', 'Taxes', 'Impuestos', 'expense', '#ef4444'),
('Utilidades', 'Utilities', 'Servicios', 'expense', '#ef4444'),
('Internet', 'Internet', 'Internet', 'expense', '#ef4444'),
('Telefone', 'Phone', 'Teléfono', 'expense', '#ef4444'),
('Streaming', 'Streaming', 'Streaming', 'expense', '#ef4444'),
('Assinatura', 'Subscription', 'Suscripción', 'expense', '#ef4444'),
('Restaurante', 'Restaurant', 'Restaurante', 'expense', '#ef4444'),
('Supermercado', 'Groceries', 'Supermercado', 'expense', '#ef4444'),
('Farmácia', 'Pharmacy', 'Farmacia', 'expense', '#ef4444'),
('Beleza', 'Beauty', 'Belleza', 'expense', '#ef4444'),
('Pet', 'Pet', 'Mascota', 'expense', '#ef4444'),
('Presente', 'Gift', 'Regalo', 'expense', '#ef4444'),
('Doação', 'Donation', 'Donación', 'expense', '#ef4444'),
('Contas Básicas', 'Basic Bills', 'Cuentas Básicas', 'expense', '#ef4444'),
('Transferência', 'Transfer', 'Transferencia', 'expense', '#ef4444'),
('Pagamento de Cartão de Crédito', 'Credit Card Payment', 'Pago de Tarjeta de Crédito', 'expense', '#ef4444');

-- Função para criar categorias padrão para um usuário
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(user_id UUID, user_language TEXT DEFAULT 'pt')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  default_cat RECORD;
  category_name TEXT;
BEGIN
  -- Verificar se usuário já tem categorias
  IF EXISTS (SELECT 1 FROM public.categories WHERE categories.user_id = create_default_categories_for_user.user_id) THEN
    RETURN;
  END IF;

  -- Criar categorias padrão baseadas no idioma do usuário
  FOR default_cat IN 
    SELECT 
      name_pt, name_en, name_es, color, icon, category_type 
    FROM public.default_categories 
  LOOP
    -- Selecionar nome baseado no idioma
    category_name := CASE 
      WHEN user_language = 'en' THEN default_cat.name_en
      WHEN user_language = 'es' THEN default_cat.name_es
      ELSE default_cat.name_pt
    END;

    -- Inserir categoria para o usuário
    INSERT INTO public.categories (
      name, color, icon, category_type, owner_user, user_id
    ) VALUES (
      category_name,
      default_cat.color,
      default_cat.icon,
      default_cat.category_type,
      'user1',
      create_default_categories_for_user.user_id
    );
  END LOOP;
END;
$$;

-- Função para traduzir automaticamente nomes de categorias
CREATE OR REPLACE FUNCTION public.auto_translate_category_name(input_name TEXT, from_lang TEXT DEFAULT 'pt')
RETURNS TABLE(pt_name TEXT, en_name TEXT, es_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  normalized_input TEXT;
  default_cat RECORD;
BEGIN
  normalized_input := lower(regexp_replace(trim(coalesce(input_name, '')), '\s+', ' ', 'g'));
  
  -- Buscar na tabela de categorias padrão
  SELECT name_pt, name_en, name_es INTO default_cat
  FROM public.default_categories
  WHERE 
    lower(regexp_replace(trim(name_pt), '\s+', ' ', 'g')) = normalized_input OR
    lower(regexp_replace(trim(name_en), '\s+', ' ', 'g')) = normalized_input OR
    lower(regexp_replace(trim(name_es), '\s+', ' ', 'g')) = normalized_input
  LIMIT 1;
  
  IF FOUND THEN
    pt_name := default_cat.name_pt;
    en_name := default_cat.name_en;
    es_name := default_cat.name_es;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Se não encontrou, retornar o nome original
  pt_name := input_name;
  en_name := input_name;
  es_name := input_name;
  RETURN NEXT;
END;
$$;

-- Trigger para criar categorias padrão quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Criar trigger para executar quando um perfil é criado
CREATE TRIGGER create_default_categories_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_categories();

-- Criar categorias padrão para usuários existentes que não têm categorias
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT p.user_id
    FROM public.profiles p
    LEFT JOIN public.categories c ON c.user_id = p.user_id
    WHERE c.user_id IS NULL
  LOOP
    PERFORM public.create_default_categories_for_user(user_record.user_id, 'pt');
  END LOOP;
END $$;