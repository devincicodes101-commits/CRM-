-- Batch 3 (Base44 port §8–§11): white-label invoicing links + per-job reviews.

-- ─── Invoices: job link + contractor + deposit ───────────────────────────────
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS job_id                 uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_contractor_id uuid REFERENCES public.contractors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deposit_percent        numeric(5,2);

CREATE INDEX IF NOT EXISTS idx_invoices_job ON public.invoices(job_id);

-- §8 dedupe key: one invoice per (job, invoice_type). A job can still have both a
-- 'deposit' and a 'standard' invoice — they differ by invoice_type. Partial
-- unique index so job-less invoices (ad-hoc / credit notes) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_invoice_job_type
  ON public.invoices(job_id, invoice_type)
  WHERE job_id IS NOT NULL;

-- ─── Reviews: link to the contractor + tokenised per-job review ──────────────
-- The reviews table shipped Google-review-shaped; §11 wants per-job customer
-- reviews that resolve to the assigned contractor (feeds the §6 picker + reports).
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS contractor_id uuid REFERENCES public.contractors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS message_token text;

CREATE INDEX IF NOT EXISTS idx_reviews_contractor ON public.reviews(contractor_id);

-- One customer review per job (public submissions dedupe on this).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_review_job
  ON public.reviews(job_id)
  WHERE job_id IS NOT NULL AND source = 'customer';
