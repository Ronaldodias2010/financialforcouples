-- Atualizamos as categorias de usuário para vincular aos novos padrões
WITH category_mappings AS (
  SELECT 
    c.id as user_category_id,
    c.name as user_category_name,
    dc.id as default_category_id,
    dc.name_pt as default_name
  FROM public.categories c
  LEFT JOIN public.default_categories dc ON (
    -- Mapeamento direto por nome normalizado
    lower(regexp_replace(trim(c.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(dc.name_pt), '\s+', ' ', 'g'))
    OR 
    -- Mapeamentos específicos para casos conhecidos
    (lower(regexp_replace(trim(c.name), '\s+', ' ', 'g')) IN ('supermercado', 'restaurante', 'padaria', 'feira', 'delivery') AND dc.name_pt = 'Alimentação')
    OR
    (lower(regexp_replace(trim(c.name), '\s+', ' ', 'g')) IN ('combustivel', 'combustível', 'uber', 'taxi', 'onibus', 'ônibus') AND dc.name_pt = 'Transporte')
    OR
    (lower(regexp_replace(trim(c.name), '\s+', ' ', 'g')) IN ('farmacia', 'farmácia', 'academia', 'hospital', 'consulta') AND dc.name_pt = 'Saúde')
    OR
    (lower(regexp_replace(trim(c.name), '\s+', ' ', 'g')) IN ('escola', 'faculdade', 'curso', 'livros') AND dc.name_pt = 'Educação')
    OR
    (lower(regexp_replace(trim(c.name), '\s+', ' ', 'g')) IN ('cinema', 'netflix', 'spotify', 'show', 'bar', 'viagem') AND dc.name_pt = 'Lazer & Entretenimento')
    OR
    (lower(regexp_replace(trim(c.name), '\s+', ' ', 'g')) IN ('roupas', 'shopping', 'cosmeticos', 'cosméticos') AND dc.name_pt = 'Compras Pessoais')
    OR
    (lower(regexp_replace(trim(c.name), '\s+', ' ', 'g')) IN ('aluguel', 'luz', 'água', 'agua', 'gas', 'gás', 'internet') AND dc.name_pt = 'Moradia')
    OR
    (lower(regexp_replace(trim(c.name), '\s+', ' ', 'g')) IN ('creche', 'brinquedos', 'mesada') AND dc.name_pt = 'Família & Filhos')
    OR
    (lower(regexp_replace(trim(c.name), '\s+', ' ', 'g')) IN ('seguro', 'impostos', 'banco', 'assinatura') AND dc.name_pt = 'Finanças & Serviços')
    OR
    (lower(regexp_replace(trim(c.name), '\s+', ' ', 'g')) IN ('software', 'coworking', 'trabalho') AND dc.name_pt = 'Trabalho & Negócios')
    OR
    (lower(regexp_replace(trim(c.name), '\s+', ' ', 'g')) IN ('presente', 'presentes', 'doacao', 'doação', 'caridade') AND dc.name_pt = 'Doações & Presentes')
  )
  WHERE c.category_type = 'expense'
    AND dc.category_type = 'expense'
)
UPDATE public.categories 
SET default_category_id = category_mappings.default_category_id
FROM category_mappings
WHERE categories.id = category_mappings.user_category_id
  AND category_mappings.default_category_id IS NOT NULL;