-- Add subcategory enrichment fields to incoming_financial_inputs
ALTER TABLE incoming_financial_inputs
ADD COLUMN IF NOT EXISTS subcategory_hint TEXT,
ADD COLUMN IF NOT EXISTS resolved_subcategory_id UUID REFERENCES subcategories(id),
ADD COLUMN IF NOT EXISTS subcategory_confidence TEXT CHECK (subcategory_confidence IN ('alta', 'media', 'baixa'));

-- Add comment for documentation
COMMENT ON COLUMN incoming_financial_inputs.subcategory_hint IS 'Semantic hint detected from message for subcategory';
COMMENT ON COLUMN incoming_financial_inputs.resolved_subcategory_id IS 'Resolved subcategory UUID after EDGE enrichment';
COMMENT ON COLUMN incoming_financial_inputs.subcategory_confidence IS 'Confidence level: alta (exact match), media (partial), baixa (uncertain)';