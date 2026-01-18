-- Tabela principal de decisões do casal
CREATE TABLE public.couple_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES public.user_couples(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'voting', 'agreed', 'rejected', 'paused', 'completed')),
  decision_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  estimated_value DECIMAL(15,2),
  currency TEXT DEFAULT 'BRL',
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  motivation TEXT CHECK (motivation IN ('necessity', 'dream', 'comfort', 'investment', 'other')),
  target_date DATE,
  who_wants TEXT CHECK (who_wants IN ('user1', 'user2', 'both')),
  context_data JSONB DEFAULT '{}',
  restrictions JSONB DEFAULT '{}',
  scenarios JSONB DEFAULT '[]',
  final_decision JSONB,
  action_plan JSONB DEFAULT '[]',
  paused_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de votos nas decisões
CREATE TABLE public.couple_decision_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID REFERENCES public.couple_decisions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('agree', 'agree_with_condition', 'disagree')),
  selected_scenario TEXT,
  condition TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(decision_id, user_id)
);

-- Tabela de combinados/acordos do casal
CREATE TABLE public.couple_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES public.user_couples(id) ON DELETE CASCADE,
  decision_id UUID REFERENCES public.couple_decisions(id) ON DELETE SET NULL,
  agreement_type TEXT NOT NULL CHECK (agreement_type IN ('spending_limit', 'category_consensus', 'installment_limit', 'priority', 'savings_goal', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  review_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_by_user1 BOOLEAN DEFAULT false,
  accepted_by_user2 BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de compliance/acompanhamento dos combinados
CREATE TABLE public.couple_agreement_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES public.couple_agreements(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  compliant BOOLEAN,
  compliance_percentage DECIMAL(5,2),
  violations JSONB DEFAULT '[]',
  notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.couple_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_decision_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_agreement_compliance ENABLE ROW LEVEL SECURITY;

-- Policies for couple_decisions
CREATE POLICY "Users can view decisions of their couple"
ON public.couple_decisions FOR SELECT
USING (
  couple_id IN (
    SELECT id FROM public.user_couples 
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

CREATE POLICY "Users can create decisions for their couple"
ON public.couple_decisions FOR INSERT
WITH CHECK (
  couple_id IN (
    SELECT id FROM public.user_couples 
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update decisions of their couple"
ON public.couple_decisions FOR UPDATE
USING (
  couple_id IN (
    SELECT id FROM public.user_couples 
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

CREATE POLICY "Users can delete decisions they created"
ON public.couple_decisions FOR DELETE
USING (created_by = auth.uid());

-- Policies for couple_decision_votes
CREATE POLICY "Users can view votes on their couple decisions"
ON public.couple_decision_votes FOR SELECT
USING (
  decision_id IN (
    SELECT cd.id FROM public.couple_decisions cd
    JOIN public.user_couples uc ON cd.couple_id = uc.id
    WHERE uc.user1_id = auth.uid() OR uc.user2_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own votes"
ON public.couple_decision_votes FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND decision_id IN (
    SELECT cd.id FROM public.couple_decisions cd
    JOIN public.user_couples uc ON cd.couple_id = uc.id
    WHERE uc.user1_id = auth.uid() OR uc.user2_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own votes"
ON public.couple_decision_votes FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own votes"
ON public.couple_decision_votes FOR DELETE
USING (user_id = auth.uid());

-- Policies for couple_agreements
CREATE POLICY "Users can view agreements of their couple"
ON public.couple_agreements FOR SELECT
USING (
  couple_id IN (
    SELECT id FROM public.user_couples 
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

CREATE POLICY "Users can create agreements for their couple"
ON public.couple_agreements FOR INSERT
WITH CHECK (
  couple_id IN (
    SELECT id FROM public.user_couples 
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

CREATE POLICY "Users can update agreements of their couple"
ON public.couple_agreements FOR UPDATE
USING (
  couple_id IN (
    SELECT id FROM public.user_couples 
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

CREATE POLICY "Users can delete agreements of their couple"
ON public.couple_agreements FOR DELETE
USING (
  couple_id IN (
    SELECT id FROM public.user_couples 
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

-- Policies for couple_agreement_compliance
CREATE POLICY "Users can view compliance of their couple agreements"
ON public.couple_agreement_compliance FOR SELECT
USING (
  agreement_id IN (
    SELECT ca.id FROM public.couple_agreements ca
    JOIN public.user_couples uc ON ca.couple_id = uc.id
    WHERE uc.user1_id = auth.uid() OR uc.user2_id = auth.uid()
  )
);

CREATE POLICY "Users can create compliance records for their couple"
ON public.couple_agreement_compliance FOR INSERT
WITH CHECK (
  agreement_id IN (
    SELECT ca.id FROM public.couple_agreements ca
    JOIN public.user_couples uc ON ca.couple_id = uc.id
    WHERE uc.user1_id = auth.uid() OR uc.user2_id = auth.uid()
  )
);

CREATE POLICY "Users can update compliance records of their couple"
ON public.couple_agreement_compliance FOR UPDATE
USING (
  agreement_id IN (
    SELECT ca.id FROM public.couple_agreements ca
    JOIN public.user_couples uc ON ca.couple_id = uc.id
    WHERE uc.user1_id = auth.uid() OR uc.user2_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_couple_decisions_couple_id ON public.couple_decisions(couple_id);
CREATE INDEX idx_couple_decisions_status ON public.couple_decisions(status);
CREATE INDEX idx_couple_decisions_created_at ON public.couple_decisions(created_at DESC);
CREATE INDEX idx_couple_decision_votes_decision_id ON public.couple_decision_votes(decision_id);
CREATE INDEX idx_couple_agreements_couple_id ON public.couple_agreements(couple_id);
CREATE INDEX idx_couple_agreements_is_active ON public.couple_agreements(is_active);
CREATE INDEX idx_couple_agreement_compliance_agreement_id ON public.couple_agreement_compliance(agreement_id);

-- Trigger for updated_at
CREATE TRIGGER update_couple_decisions_updated_at
BEFORE UPDATE ON public.couple_decisions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_couple_decision_votes_updated_at
BEFORE UPDATE ON public.couple_decision_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_couple_agreements_updated_at
BEFORE UPDATE ON public.couple_agreements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();