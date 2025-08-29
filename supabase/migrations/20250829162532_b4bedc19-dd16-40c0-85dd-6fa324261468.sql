-- Add description field to categories table
ALTER TABLE public.categories 
ADD COLUMN description TEXT;

-- Add description fields to default_categories table
ALTER TABLE public.default_categories 
ADD COLUMN description_pt TEXT,
ADD COLUMN description_en TEXT,
ADD COLUMN description_es TEXT;

-- Drop existing function and recreate with new signature
DROP FUNCTION IF EXISTS public.auto_translate_category_name(text, text);

CREATE OR REPLACE FUNCTION public.auto_translate_category_name(input_name text, from_lang text DEFAULT 'pt'::text)
 RETURNS TABLE(pt_name text, en_name text, es_name text, pt_description text, en_description text, es_description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  normalized_input TEXT;
  default_cat RECORD;
BEGIN
  normalized_input := lower(regexp_replace(trim(coalesce(input_name, '')), '\s+', ' ', 'g'));
  
  -- Buscar na tabela de categorias padrão
  SELECT name_pt, name_en, name_es, description_pt, description_en, description_es INTO default_cat
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
    pt_description := default_cat.description_pt;
    en_description := default_cat.description_en;
    es_description := default_cat.description_es;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Se não encontrou, retornar o nome original sem descrições
  pt_name := input_name;
  en_name := input_name;
  es_name := input_name;
  pt_description := NULL;
  en_description := NULL;
  es_description := NULL;
  RETURN NEXT;
END;
$function$;

-- Update default categories with descriptions
UPDATE public.default_categories SET 
  description_pt = 'Gastos com comida e bebidas, incluindo restaurantes, padarias, supermercados, delivery, lanches, cafés, açougues, mercearias e qualquer compra relacionada a alimentação',
  description_en = 'Food and beverage expenses, including restaurants, bakeries, supermarkets, food delivery, snacks, cafes, butcher shops, grocery stores and any food-related purchases',
  description_es = 'Gastos en comida y bebidas, incluyendo restaurantes, panaderías, supermercados, delivery, bocadillos, cafeterías, carnicerías, tiendas de comestibles y cualquier compra relacionada con alimentación'
WHERE name_pt = 'Alimentação';

UPDATE public.default_categories SET 
  description_pt = 'Serviços mensais recorrentes como Netflix, Spotify, Amazon Prime, Disney+, aplicativos pagos, softwares, academias, jornais, revistas e qualquer assinatura ou mensalidade',
  description_en = 'Monthly recurring services like Netflix, Spotify, Amazon Prime, Disney+, paid apps, software, gyms, newspapers, magazines and any subscription or monthly fee',
  description_es = 'Servicios mensuales recurrentes como Netflix, Spotify, Amazon Prime, Disney+, aplicaciones de pago, software, gimnasios, periódicos, revistas y cualquier suscripción o mensualidad'
WHERE name_pt = 'Assinaturas';

UPDATE public.default_categories SET 
  description_pt = 'Gastos com deslocamento incluindo combustível, manutenção veicular, pedágios, Uber, táxi, transporte público, estacionamento, lavagem de carro e todos os custos relacionados ao transporte',
  description_en = 'Transportation expenses including fuel, vehicle maintenance, tolls, Uber, taxi, public transport, parking, car wash and all transport-related costs',
  description_es = 'Gastos de transporte incluyendo combustible, mantenimiento vehicular, peajes, Uber, taxi, transporte público, estacionamiento, lavado de auto y todos los costos relacionados con el transporte'
WHERE name_pt = 'Transporte';

UPDATE public.default_categories SET 
  description_pt = 'Despesas médicas, farmácias, consultas, exames, planos de saúde, medicamentos, tratamentos, dentista, psicólogo e todos os gastos relacionados à saúde e bem-estar',
  description_en = 'Medical expenses, pharmacies, consultations, exams, health insurance, medications, treatments, dentist, psychologist and all health and wellness related expenses',
  description_es = 'Gastos médicos, farmacias, consultas, exámenes, seguros de salud, medicamentos, tratamientos, dentista, psicólogo y todos los gastos relacionados con salud y bienestar'
WHERE name_pt = 'Saúde';

UPDATE public.default_categories SET 
  description_pt = 'Gastos com diversão e entretenimento como cinema, teatro, shows, jogos, parques, viagens, hobbies, livros, música e atividades de lazer',
  description_en = 'Entertainment and fun expenses like cinema, theater, concerts, games, parks, trips, hobbies, books, music and leisure activities',
  description_es = 'Gastos de entretenimiento y diversión como cine, teatro, conciertos, juegos, parques, viajes, pasatiempos, libros, música y actividades de ocio'
WHERE name_pt = 'Entretenimento';

UPDATE public.default_categories SET 
  description_pt = 'Despesas com moradia incluindo aluguel, financiamento, condomínio, IPTU, energia elétrica, água, gás, internet, telefone, manutenção e reparos da casa',
  description_en = 'Housing expenses including rent, mortgage, condo fees, property tax, electricity, water, gas, internet, phone, home maintenance and repairs',
  description_es = 'Gastos de vivienda incluyendo alquiler, hipoteca, gastos de condominio, impuestos inmobiliarios, electricidad, agua, gas, internet, teléfono, mantenimiento y reparaciones del hogar'
WHERE name_pt = 'Casa';

UPDATE public.default_categories SET 
  description_pt = 'Compras de roupas, sapatos, acessórios, joias, bolsas, produtos de beleza, cosméticos, perfumes, cortes de cabelo e cuidados pessoais',
  description_en = 'Shopping for clothes, shoes, accessories, jewelry, bags, beauty products, cosmetics, perfumes, haircuts and personal care',
  description_es = 'Compras de ropa, zapatos, accesorios, joyas, bolsos, productos de belleza, cosméticos, perfumes, cortes de cabello y cuidado personal'
WHERE name_pt = 'Compras';

UPDATE public.default_categories SET 
  description_pt = 'Cursos, livros, material escolar, mensalidade de escola/faculdade, treinamentos, certificações e investimentos em conhecimento e aprendizado',
  description_en = 'Courses, books, school supplies, school/college tuition, training, certifications and investments in knowledge and learning',
  description_es = 'Cursos, libros, material escolar, colegiaturas de escuela/universidad, entrenamientos, certificaciones e inversiones en conocimiento y aprendizaje'
WHERE name_pt = 'Educação';

UPDATE public.default_categories SET 
  description_pt = 'Receitas de salário, freelances, vendas, investimentos, aluguéis, prêmios, presentes em dinheiro e qualquer entrada de dinheiro',
  description_en = 'Income from salary, freelance work, sales, investments, rent, prizes, cash gifts and any money inflow',
  description_es = 'Ingresos de salario, trabajos freelance, ventas, inversiones, alquileres, premios, regalos en efectivo y cualquier entrada de dinero'
WHERE name_pt = 'Salário';

UPDATE public.default_categories SET 
  description_pt = 'Outras receitas diversas como reembolsos, devoluções, vendas ocasionais, presentes, prêmios e entradas de dinheiro não categorizadas',
  description_en = 'Other miscellaneous income like refunds, returns, occasional sales, gifts, prizes and uncategorized money inflows',
  description_es = 'Otros ingresos diversos como reembolsos, devoluciones, ventas ocasionales, regalos, premios y entradas de dinero no categorizadas'
WHERE name_pt = 'Outras Receitas';

UPDATE public.default_categories SET 
  description_pt = 'Gastos diversos que não se encaixam nas outras categorias, despesas eventuais, emergências, doações e gastos não classificados',
  description_en = 'Miscellaneous expenses that do not fit in other categories, occasional expenses, emergencies, donations and unclassified expenses',
  description_es = 'Gastos diversos que no encajan en otras categorías, gastos eventuales, emergencias, donaciones y gastos no clasificados'
WHERE name_pt = 'Outros';