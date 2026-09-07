-- Migration 020: Monri → Stripe + installment payments
-- webshop_orders already has stripe_session_id, stripe_payment_intent,
-- stripe_customer_id (from 007). enrollments has the legacy Stripe columns
-- (from 002) — this adds installment tracking + the 'suspended' status.

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_plan TEXT NOT NULL DEFAULT 'full',  -- 'full' | 'installments'
  ADD COLUMN IF NOT EXISTS fully_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_enrollments_stripe_subscription
  ON public.enrollments(stripe_subscription_id);

-- Widen the status CHECK constraint: 'suspended' = installment default,
-- access paused until the outstanding amount is settled.
ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_status_check;
ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_status_check
  CHECK (status IN ('active', 'expired', 'cancelled', 'refunded', 'suspended'));
