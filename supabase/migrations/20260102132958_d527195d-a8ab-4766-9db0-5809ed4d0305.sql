-- Add columns for Diagnostic Wizard (Phase 1)
ALTER TABLE public.tax_report_config 
ADD COLUMN IF NOT EXISTS diagnostic_answers JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS diagnostic_completed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS section_status JSONB DEFAULT '{}';

-- Add columns for Suggestions (Phase 3)
ALTER TABLE public.tax_report_config 
ADD COLUMN IF NOT EXISTS accepted_suggestions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS rejected_suggestions JSONB DEFAULT '[]';

-- Add columns for Post-Declaration (Phase 7)
ALTER TABLE public.tax_report_config 
ADD COLUMN IF NOT EXISTS declared_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS final_summary JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS receita_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS notes_next_year TEXT DEFAULT NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_tax_report_config_declared_at ON public.tax_report_config(declared_at);
CREATE INDEX IF NOT EXISTS idx_tax_report_config_diagnostic ON public.tax_report_config(diagnostic_completed_at);