-- Batch B (§5/§6) — contractor commission chase state + fee %.
-- The AppyLead agency fee is a % of the job value billed to the assigned
-- contractor; unpaid invoices are chased on a schedule and, at 14 days, the
-- contractor is suspended.

ALTER TABLE public.contractor_commission_invoices
  ADD COLUMN IF NOT EXISTS commission_percent    numeric(5,2),
  ADD COLUMN IF NOT EXISTS reminder_stages_sent  integer[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS suspended_contractor  boolean NOT NULL DEFAULT false;

-- (contractors.suspended / suspended_at / suspension_reason already exist from
--  20260717000001_base44_gap_fill.sql; company_settings.agency_* + agency_fee_percent
--  and jobs.agency_fee_percent also already exist there.)
