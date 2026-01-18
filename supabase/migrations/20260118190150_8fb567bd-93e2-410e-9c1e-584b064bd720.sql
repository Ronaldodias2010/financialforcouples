-- Create mileage_programs table for storing connected program accounts
CREATE TABLE public.mileage_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_code TEXT NOT NULL,
  program_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  balance_miles NUMERIC DEFAULT 0,
  balance_value NUMERIC DEFAULT NULL,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  external_member_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_code)
);

-- Create indexes
CREATE INDEX idx_mileage_programs_user ON public.mileage_programs(user_id);
CREATE INDEX idx_mileage_programs_status ON public.mileage_programs(status);

-- Enable RLS
ALTER TABLE public.mileage_programs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own mileage programs"
  ON public.mileage_programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mileage programs"
  ON public.mileage_programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mileage programs"
  ON public.mileage_programs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mileage programs"
  ON public.mileage_programs FOR DELETE
  USING (auth.uid() = user_id);

-- Create mileage_program_history table for synced transactions
CREATE TABLE public.mileage_program_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id UUID REFERENCES public.mileage_programs(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT,
  miles_amount NUMERIC NOT NULL,
  transaction_type TEXT,
  source TEXT DEFAULT 'api_sync',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for history
CREATE INDEX idx_program_history_user ON public.mileage_program_history(user_id);
CREATE INDEX idx_program_history_program ON public.mileage_program_history(program_id);
CREATE INDEX idx_program_history_date ON public.mileage_program_history(transaction_date);

-- Enable RLS
ALTER TABLE public.mileage_program_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for history
CREATE POLICY "Users can view own program history"
  ON public.mileage_program_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own program history"
  ON public.mileage_program_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_mileage_programs_updated_at
  BEFORE UPDATE ON public.mileage_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();