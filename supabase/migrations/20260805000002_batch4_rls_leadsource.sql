-- Batch 4 (Base44 port §16, §18): lock job creation to staff; AI-agent lead source.

-- ─── §16 Job creation locked to staff — contractor excluded at the DB layer ───
-- Base44's old rule let any logged-in user (incl. contractors) create jobs.
-- Allow only the staff roles; contractor (and customer, who has no user row)
-- can never INSERT. Public customer booking is routed through a service-role
-- server action instead (bookJobFromQuote / publicRescheduleJob).
DROP POLICY IF EXISTS "jobs: admin/manager insert" ON public.jobs;
CREATE POLICY "jobs: staff insert"
  ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'user', 'operative', 'sales', 'telesales'));

-- ─── §18 AI telesales agent as a lead source ─────────────────────────────────
-- New enum value so AI-generated leads are filterable in the pipeline.
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'ai_sales_agent';
