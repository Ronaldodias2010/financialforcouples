-- Soft-delete de TODAS as categorias "Quitação Dívida Crédito" (com e sem default_category_id)
UPDATE categories 
SET deleted_at = now()
WHERE (name ILIKE '%quita%' AND name ILIKE '%cr%dito%')
  AND deleted_at IS NULL;