-- Soft-delete "Emprestimo" categories from income type (they are not income)
UPDATE public.categories
SET deleted_at = now()
WHERE category_type = 'income'
  AND name ILIKE '%emprestimo%'
  AND deleted_at IS NULL;