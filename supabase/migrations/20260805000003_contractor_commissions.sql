-- Batch 3 follow-up (§8/§9): contractor commission invoices.
-- Under white-label invoicing the contractor bills the customer the full value
-- and owes us the agency fee (the company's share). This table is that bill —
-- FROM the company TO the contractor. Distinct from commission_invoices, which
-- is the sales-agent quote commission.

CREATE SEQUENCE IF NOT EXISTS contractor_commission_seq START 1;

CREATE TABLE IF NOT EXISTS public.contractor_commission_invoices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number        text NOT NULL UNIQUE
                          DEFAULT ('CCI-' || lpad(nextval('contractor_commission_seq')::text, 5, '0')),
  job_id                uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  customer_invoice_id   uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  contractor_id         uuid REFERENCES public.contractors(id) ON DELETE SET NULL,
  contractor_user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contractor_name       text,
  contractor_email      text,
  job_title             text,
  job_value             numeric(10,2) NOT NULL DEFAULT 0,
  contractor_pay_amount numeric(10,2) NOT NULL DEFAULT 0,
  commission_amount     numeric(10,2) NOT NULL DEFAULT 0,  -- the company's share (agency fee)
  vat_amount            numeric(10,2) NOT NULL DEFAULT 0,
  total_due             numeric(10,2) NOT NULL DEFAULT 0,
  status                commission_invoice_status NOT NULL DEFAULT 'draft',
  sent_date             timestamptz,
  paid_date             timestamptz,
  notes                 text,
  created_by_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date          timestamptz NOT NULL DEFAULT now(),
  updated_date          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id)  -- one commission invoice per job (dedupe)
);

CREATE INDEX IF NOT EXISTS idx_ccinv_contractor ON public.contractor_commission_invoices(contractor_id);
CREATE INDEX IF NOT EXISTS idx_ccinv_status ON public.contractor_commission_invoices(status);
SELECT attach_updated_date_trigger('contractor_commission_invoices');
ALTER TABLE public.contractor_commission_invoices ENABLE ROW LEVEL SECURITY;

-- Staff full; contractor may read only their own.
CREATE POLICY "ccinv: staff read"
  ON public.contractor_commission_invoices FOR SELECT TO authenticated
  USING (current_user_role() IN ('admin', 'user') OR contractor_user_id = auth.uid());

CREATE POLICY "ccinv: staff insert"
  ON public.contractor_commission_invoices FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'user'));

CREATE POLICY "ccinv: admin update"
  ON public.contractor_commission_invoices FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "ccinv: admin delete"
  ON public.contractor_commission_invoices FOR DELETE TO authenticated USING (is_admin());
