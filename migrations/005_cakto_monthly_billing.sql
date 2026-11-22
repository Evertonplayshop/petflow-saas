-- ============================================================================
-- PETFLOW SaaS - Migration 005: Cakto monthly billing
-- ============================================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS cakto_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS cakto_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'cakto',
  provider_event_id TEXT,
  event_type TEXT NOT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_billing_event_provider_id UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_events_tenant
  ON public.billing_events (tenant_id, created_at DESC);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_events_tenant_select ON public.billing_events;
CREATE POLICY billing_events_tenant_select ON public.billing_events
  FOR SELECT USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id));
