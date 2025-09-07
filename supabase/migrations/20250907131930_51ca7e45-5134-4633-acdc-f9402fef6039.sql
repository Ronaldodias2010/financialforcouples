-- Criar associações entre categorias padrão e as novas tags criadas

-- Primeiro, buscar as default_categories e criar associações baseadas no nome

-- Alimentação
WITH alimentacao_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%alimenta%' OR name_pt ILIKE '%comida%' LIMIT 1
),
alimentacao_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('supermercado', 'padaria', 'restaurante', 'lanchonete', 'delivery', 'feira', 'café', 'fast food')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM alimentacao_cat a CROSS JOIN alimentacao_tags t
WHERE NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Transporte
WITH transporte_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%transport%' LIMIT 1
),
transporte_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('combustível', 'uber/99', 'ônibus', 'metrô', 'pedágio', 'estacionamento', 'manutenção veículo', 'táxi')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM transporte_cat a CROSS JOIN transporte_tags t
WHERE NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Moradia
WITH moradia_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%moradia%' OR name_pt ILIKE '%casa%' LIMIT 1
),
moradia_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('aluguel', 'condomínio', 'luz', 'água', 'gás', 'internet', 'telefone fixo', 'manutenção', 'móveis', 'eletrodomésticos')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM moradia_cat a CROSS JOIN moradia_tags t
WHERE NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Saúde
WITH saude_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%saude%' OR name_pt ILIKE '%saúde%' LIMIT 1
),
saude_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('farmácia', 'plano de saúde', 'exames', 'consultas', 'academia', 'hospital', 'terapia')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM saude_cat a CROSS JOIN saude_tags t
WHERE NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Educação
WITH educacao_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%educa%' LIMIT 1
),
educacao_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('faculdade', 'curso online', 'livros', 'material escolar', 'palestras', 'treinamentos')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM educacao_cat a CROSS JOIN educacao_tags t
WHERE NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Lazer & Entretenimento
WITH lazer_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%lazer%' OR name_pt ILIKE '%entreteni%' LIMIT 1
),
lazer_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('cinema', 'shows', 'streaming', 'bar', 'viagem', 'festas', 'hobbies', 'esportes')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM lazer_cat a CROSS JOIN lazer_tags t
WHERE NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Vestuário/Compras Pessoais
WITH vestuario_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%vestuario%' OR name_pt ILIKE '%roupa%' LIMIT 1
),
vestuario_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('roupas', 'calçados', 'acessórios', 'eletrônicos', 'cosméticos', 'perfumaria')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM vestuario_cat a CROSS JOIN vestuario_tags t
WHERE NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Receita Extraordinária
WITH receita_extra_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%extraordin%' LIMIT 1
),
receita_extra_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('herança', 'doações recebidas', 'loteria', 'indenizações', 'restituição de impostos')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM receita_extra_cat a CROSS JOIN receita_extra_tags t
WHERE NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Adicionar associações para categorias que podem existir mas não têm match direto
-- Tenta associar por palavras-chave similares

-- Família/Filhos (se existir)
WITH familia_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%familia%' OR name_pt ILIKE '%filho%' LIMIT 1
),
familia_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('escola', 'creche', 'brinquedos', 'roupas infantis', 'mesada', 'cuidados')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM familia_cat a CROSS JOIN familia_tags t
WHERE EXISTS (SELECT 1 FROM familia_cat)
AND NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Investimentos (se existir)
WITH investimento_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%investimento%' LIMIT 1
),
investimento_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('ações', 'fundos imobiliários', 'criptomoedas', 'renda fixa', 'previdência privada', 'tesouro direto', 'corretagem')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM investimento_cat a CROSS JOIN investimento_tags t
WHERE EXISTS (SELECT 1 FROM investimento_cat)
AND NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Pet/Animais (se existir)
WITH pet_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%pet%' OR name_pt ILIKE '%animal%' LIMIT 1
),
pet_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('ração', 'pet shop', 'veterinário', 'vacinas', 'banho & tosa', 'acessórios')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM pet_cat a CROSS JOIN pet_tags t
WHERE EXISTS (SELECT 1 FROM pet_cat)
AND NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Viagens (separada se existir)
WITH viagem_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%viagem%' AND name_pt NOT ILIKE '%lazer%' LIMIT 1
),
viagem_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('passagens aéreas', 'hospedagem', 'seguro viagem', 'aluguel de carro', 'pacotes turísticos', 'alimentação viagem')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM viagem_cat a CROSS JOIN viagem_tags t
WHERE EXISTS (SELECT 1 FROM viagem_cat)
AND NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Beleza (se existir)
WITH beleza_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%beleza%' LIMIT 1
),
beleza_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('salão de beleza', 'barbearia', 'manicure', 'estética', 'produtos de higiene', 'maquiagem')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM beleza_cat a CROSS JOIN beleza_tags t
WHERE EXISTS (SELECT 1 FROM beleza_cat)
AND NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Tecnologia (se existir)
WITH tecnologia_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%tecnologia%' OR name_pt ILIKE '%digital%' LIMIT 1
),
tecnologia_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('celular', 'notebook', 'aplicativos', 'antivírus', 'softwares', 'domínio/site', 'armazenamento em nuvem')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM tecnologia_cat a CROSS JOIN tecnologia_tags t
WHERE EXISTS (SELECT 1 FROM tecnologia_cat)
AND NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Trabalho/Negócios (se existir)
WITH trabalho_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%trabalho%' OR name_pt ILIKE '%negocio%' LIMIT 1
),
trabalho_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('coworking', 'software', 'equipamentos', 'viagens de trabalho', 'marketing', 'impostos PJ')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM trabalho_cat a CROSS JOIN trabalho_tags t
WHERE EXISTS (SELECT 1 FROM trabalho_cat)
AND NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Finanças (se existir)
WITH financas_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%financa%' OR name_pt ILIKE '%servico%' LIMIT 1
),
financas_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('taxas bancárias', 'seguros', 'investimentos', 'impostos', 'mensalidades', 'assinatura de serviços')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM financas_cat a CROSS JOIN financas_tags t
WHERE EXISTS (SELECT 1 FROM financas_cat)
AND NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Doações/Presentes (se existir)
WITH doacoes_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%doacao%' OR name_pt ILIKE '%presente%' LIMIT 1
),
doacoes_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('presentes', 'doações', 'caridade', 'festas de aniversário', 'casamentos')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM doacoes_cat a CROSS JOIN doacoes_tags t
WHERE EXISTS (SELECT 1 FROM doacoes_cat)
AND NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Outros (se existir)
WITH outros_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%outros%' LIMIT 1
),
outros_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('emergências', 'imprevistos', 'não categorizados')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM outros_cat a CROSS JOIN outros_tags t
WHERE EXISTS (SELECT 1 FROM outros_cat)
AND NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);

-- Reforma/Construção (se existir)
WITH reforma_cat AS (
  SELECT id FROM public.default_categories WHERE name_pt ILIKE '%reforma%' OR name_pt ILIKE '%construc%' LIMIT 1
),
reforma_tags AS (
  SELECT id FROM public.category_tags WHERE name_pt IN ('material de construção', 'ferramentas', 'mão de obra', 'decoração', 'jardinagem', 'elétrica', 'hidráulica')
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT a.id, t.id FROM reforma_cat a CROSS JOIN reforma_tags t
WHERE EXISTS (SELECT 1 FROM reforma_cat)
AND NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = a.id AND ctr.tag_id = t.id
);