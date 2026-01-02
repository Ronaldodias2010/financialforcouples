-- Add tax_country column to tax_report_config
ALTER TABLE tax_report_config 
ADD COLUMN IF NOT EXISTS tax_country TEXT DEFAULT NULL;

COMMENT ON COLUMN tax_report_config.tax_country IS 'País de residência fiscal: BR, US, OTHER';