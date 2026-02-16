
-- =============================================
-- LOANS & LOAN INSTALLMENTS - Domain Tables
-- =============================================

-- Main loans table
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  owner_user TEXT DEFAULT 'user1',
  account_id UUID REFERENCES public.accounts(id),
  institution_name TEXT NOT NULL,
  principal_amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL DEFAULT 0,
  amortization_type TEXT NOT NULL DEFAULT 'price' CHECK (amortization_type IN ('price', 'sac')),
  total_installments INTEGER NOT NULL,
  installment_value NUMERIC NOT NULL DEFAULT 0,
  total_interest NUMERIC NOT NULL DEFAULT 0,
  total_payable NUMERIC NOT NULL DEFAULT 0,
  remaining_balance NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  installments_paid INTEGER NOT NULL DEFAULT 0,
  first_installment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT,
  currency TEXT NOT NULL DEFAULT 'BRL',
  deposit_transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Loan installments table
CREATE TABLE public.loan_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_part NUMERIC NOT NULL DEFAULT 0,
  interest_part NUMERIC NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  remaining_balance_after NUMERIC NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_loans_user_id ON public.loans(user_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_loan_installments_loan_id ON public.loan_installments(loan_id);
CREATE INDEX idx_loan_installments_due_date ON public.loan_installments(due_date);
CREATE INDEX idx_loan_installments_is_paid ON public.loan_installments(is_paid);

-- Enable RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_installments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loans
CREATE POLICY "Users can view their own loans"
  ON public.loans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loans"
  ON public.loans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans"
  ON public.loans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans"
  ON public.loans FOR DELETE
  USING (auth.uid() = user_id);

-- Couple access for loans
CREATE POLICY "Partners can view loans"
  ON public.loans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_couples uc
      WHERE uc.status = 'active'
      AND (
        (uc.user1_id = auth.uid() AND uc.user2_id = loans.user_id)
        OR (uc.user2_id = auth.uid() AND uc.user1_id = loans.user_id)
      )
    )
  );

-- RLS Policies for loan_installments
CREATE POLICY "Users can view their own loan installments"
  ON public.loan_installments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loan installments"
  ON public.loan_installments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loan installments"
  ON public.loan_installments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loan installments"
  ON public.loan_installments FOR DELETE
  USING (auth.uid() = user_id);

-- Couple access for loan_installments
CREATE POLICY "Partners can view loan installments"
  ON public.loan_installments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_couples uc
      WHERE uc.status = 'active'
      AND (
        (uc.user1_id = auth.uid() AND uc.user2_id = loan_installments.user_id)
        OR (uc.user2_id = auth.uid() AND uc.user1_id = loan_installments.user_id)
      )
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_installments_updated_at
  BEFORE UPDATE ON public.loan_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
