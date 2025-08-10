-- Add updated_at column to categories and trigger to auto-update it
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='categories' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.categories
      ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Ensure function exists (already exists in project)
-- Create trigger to keep updated_at fresh on UPDATE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_categories_updated_at'
  ) THEN
    CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Also fix any function that references updated_at on categories (already OK)
-- No-op if already set
