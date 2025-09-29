-- Create tables for PDF/Statement Converter system

-- Table for tracking imported files
CREATE TABLE public.imported_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'csv', 'ofx', 'image'
  file_size BIGINT NOT NULL,
  file_hash TEXT NOT NULL, -- SHA-256 hash for deduplication
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  detected_language TEXT DEFAULT 'pt', -- 'pt', 'en', 'es'
  detected_currency TEXT DEFAULT 'BRL', -- 'BRL', 'USD', 'EUR'
  detected_region TEXT, -- 'BR', 'US', 'MX', 'AR', etc.
  statement_type TEXT, -- 'bank', 'credit_card', 'auto'
  processing_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
  processing_error TEXT,
  total_transactions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for staging imported transactions before approval
CREATE TABLE public.imported_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imported_file_id UUID NOT NULL REFERENCES public.imported_files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Original extracted data
  original_description TEXT NOT NULL,
  original_date TEXT NOT NULL, -- Raw date as extracted
  original_amount TEXT NOT NULL, -- Raw amount as extracted
  original_currency TEXT,
  
  -- Normalized data
  normalized_date DATE,
  normalized_amount NUMERIC,
  normalized_currency TEXT NOT NULL DEFAULT 'BRL',
  
  -- Classification
  transaction_type TEXT, -- 'income', 'expense', 'transfer'
  suggested_category_id UUID,
  suggested_payment_method TEXT,
  confidence_score NUMERIC DEFAULT 0, -- 0-1 AI confidence
  
  -- Enrichment data
  is_installment BOOLEAN DEFAULT false,
  installment_current INTEGER,
  installment_total INTEGER,
  is_fee BOOLEAN DEFAULT false,
  is_transfer BOOLEAN DEFAULT false,
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_transaction_id UUID,
  
  -- Validation status
  validation_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'needs_review'
  review_notes TEXT,
  
  -- Final assignment
  final_category_id UUID,
  final_account_id UUID,
  final_card_id UUID,
  final_payment_method TEXT,
  final_tags TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for user-defined import rules
CREATE TABLE public.user_import_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  
  -- Condition matching
  description_pattern TEXT, -- Regex pattern
  amount_min NUMERIC,
  amount_max NUMERIC,
  
  -- Actions to apply
  assign_category_id UUID,
  assign_payment_method TEXT,
  assign_tags TEXT[],
  mark_as_transfer BOOLEAN DEFAULT false,
  
  -- Metadata
  language TEXT NOT NULL DEFAULT 'pt',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for conversion audit log
CREATE TABLE public.import_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  imported_file_id UUID REFERENCES public.imported_files(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'upload', 'process', 'approve', 'export', 'rule_apply'
  action_details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.imported_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_import_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for imported_files
CREATE POLICY "Users can manage their own imported files" ON public.imported_files
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for imported_transactions
CREATE POLICY "Users can manage their own imported transactions" ON public.imported_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_import_rules
CREATE POLICY "Users can manage their own import rules" ON public.user_import_rules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for import_audit_log
CREATE POLICY "Users can view their own import audit log" ON public.import_audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert audit logs" ON public.import_audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Indexes for better performance
CREATE INDEX idx_imported_files_user_id ON public.imported_files(user_id);
CREATE INDEX idx_imported_files_hash ON public.imported_files(file_hash);
CREATE INDEX idx_imported_transactions_file_id ON public.imported_transactions(imported_file_id);
CREATE INDEX idx_imported_transactions_user_id ON public.imported_transactions(user_id);
CREATE INDEX idx_import_rules_user_id ON public.user_import_rules(user_id);
CREATE INDEX idx_import_audit_user_id ON public.import_audit_log(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_imported_files_updated_at
  BEFORE UPDATE ON public.imported_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_imported_transactions_updated_at
  BEFORE UPDATE ON public.imported_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_import_rules_updated_at
  BEFORE UPDATE ON public.user_import_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();