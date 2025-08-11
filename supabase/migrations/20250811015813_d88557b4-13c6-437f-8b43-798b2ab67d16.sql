-- Add annual revenue column to cache metrics
ALTER TABLE public.stripe_metrics_cache
ADD COLUMN IF NOT EXISTS annual_revenue_brl numeric NOT NULL DEFAULT 0;

-- Ensure index on last_updated exists for ordering (optional safety)
-- CREATE INDEX IF NOT EXISTS idx_stripe_metrics_cache_last_updated ON public.stripe_metrics_cache (last_updated DESC);
