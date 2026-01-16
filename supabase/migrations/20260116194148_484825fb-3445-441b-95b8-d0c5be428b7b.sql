-- =====================================================
-- MARKET RATES TABLE - Store historical market indicators
-- =====================================================
CREATE TABLE public.market_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator TEXT NOT NULL,
  value DECIMAL(10,4) NOT NULL,
  previous_value DECIMAL(10,4),
  variation DECIMAL(10,4),
  unit TEXT NOT NULL DEFAULT '% a.a.',
  source TEXT NOT NULL DEFAULT 'BCB',
  bcb_series INTEGER,
  rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_market_rates_indicator ON public.market_rates(indicator);
CREATE INDEX idx_market_rates_recorded_at ON public.market_rates(recorded_at DESC);

-- Unique constraint to avoid duplicate entries per day (using rate_date column)
CREATE UNIQUE INDEX idx_market_rates_indicator_date ON public.market_rates(indicator, rate_date);

-- Enable RLS
ALTER TABLE public.market_rates ENABLE ROW LEVEL SECURITY;

-- Public read access (market rates are public data)
CREATE POLICY "Market rates are publicly readable"
ON public.market_rates FOR SELECT
USING (true);

-- Only service role can insert/update (via edge function)
CREATE POLICY "Only service role can modify market rates"
ON public.market_rates FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- USER FINANCIAL NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE public.user_financial_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  urgency TEXT NOT NULL DEFAULT 'low' CHECK (urgency IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_financial_notifications_user_id ON public.user_financial_notifications(user_id);
CREATE INDEX idx_user_financial_notifications_is_read ON public.user_financial_notifications(user_id, is_read);
CREATE INDEX idx_user_financial_notifications_type ON public.user_financial_notifications(notification_type);
CREATE INDEX idx_user_financial_notifications_created_at ON public.user_financial_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_financial_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can view their own financial notifications"
ON public.user_financial_notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own financial notifications"
ON public.user_financial_notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own financial notifications"
ON public.user_financial_notifications FOR DELETE
USING (auth.uid() = user_id);

-- Service role can insert notifications (via edge function)
CREATE POLICY "Service role can insert financial notifications"
ON public.user_financial_notifications FOR INSERT
WITH CHECK (true);

-- Trigger to update updated_at
CREATE TRIGGER update_user_financial_notifications_updated_at
BEFORE UPDATE ON public.user_financial_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();