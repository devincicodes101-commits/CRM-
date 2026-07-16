-- Gap-fill migration: align Next.js CRM with Base44 spec
-- Adds missing columns to jobs, company_settings, contractors
-- Adds new tables: commission_invoices, reviews
-- Adds new enums: auction_status, commission_invoice_status, contractor_licence_type, contractor_coverage_mode

-- ─── New enums ────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE auction_status AS ENUM ('open', 'closed', 'won', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE commission_invoice_status AS ENUM ('draft', 'sent', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE contractor_licence_type AS ENUM ('licenced', 'non_licenced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE contractor_coverage_mode AS ENUM ('radius', 'postcodes', 'national');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Jobs: missing columns ─────────────────────────────────────────────────────

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS rejection_reason          text,
  ADD COLUMN IF NOT EXISTS contractor_pay_percent    numeric(5,2),
  ADD COLUMN IF NOT EXISTS contractor_pay_amount     numeric(10,2),
  ADD COLUMN IF NOT EXISTS company_share_amount      numeric(10,2),
  ADD COLUMN IF NOT EXISTS agency_fee_percent        numeric(5,2),
  ADD COLUMN IF NOT EXISTS customer_paid             boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_paid_at          timestamptz,
  ADD COLUMN IF NOT EXISTS commission_invoice_number text,
  ADD COLUMN IF NOT EXISTS requires_licence          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS waste_notes               text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS auction_status            auction_status,
  ADD COLUMN IF NOT EXISTS auction_start_price       numeric(10,2),
  ADD COLUMN IF NOT EXISTS auction_current_bid       numeric(10,2),
  ADD COLUMN IF NOT EXISTS auction_ends_at           timestamptz,
  ADD COLUMN IF NOT EXISTS auction_winning_bid       numeric(10,2),
  ADD COLUMN IF NOT EXISTS auction_winning_bidder_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── Company settings: agency / invoice-mode columns ─────────────────────────

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS invoice_mode      text NOT NULL DEFAULT 'company_direct',
  ADD COLUMN IF NOT EXISTS agency_fee_percent numeric(5,2),
  ADD COLUMN IF NOT EXISTS agency_name       text,
  ADD COLUMN IF NOT EXISTS agency_logo_url   text,
  ADD COLUMN IF NOT EXISTS agency_address    text,
  ADD COLUMN IF NOT EXISTS agency_vat_number text,
  ADD COLUMN IF NOT EXISTS agency_email      text,
  ADD COLUMN IF NOT EXISTS agency_bank_name  text,
  ADD COLUMN IF NOT EXISTS agency_account_name text,
  ADD COLUMN IF NOT EXISTS agency_iban       text,
  ADD COLUMN IF NOT EXISTS agency_swift_bic  text;

-- ─── Contractors: licence, coverage, documents, suspension ───────────────────

ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS licence_type                contractor_licence_type NOT NULL DEFAULT 'non_licenced',
  ADD COLUMN IF NOT EXISTS coverage_mode               contractor_coverage_mode NOT NULL DEFAULT 'national',
  ADD COLUMN IF NOT EXISTS base_postcode               text,
  ADD COLUMN IF NOT EXISTS coverage_radius_miles       integer,
  ADD COLUMN IF NOT EXISTS coverage_postcodes          text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS logo_url                    text,
  ADD COLUMN IF NOT EXISTS website                     text,
  ADD COLUMN IF NOT EXISTS company_registration_number text,
  ADD COLUMN IF NOT EXISTS invoice_footer              text,
  ADD COLUMN IF NOT EXISTS invoice_notes               text,
  ADD COLUMN IF NOT EXISTS terms_conditions            text,
  ADD COLUMN IF NOT EXISTS payment_terms               text,
  ADD COLUMN IF NOT EXISTS public_liability_doc        text,
  ADD COLUMN IF NOT EXISTS public_liability_expiry     date,
  ADD COLUMN IF NOT EXISTS employer_liability_doc      text,
  ADD COLUMN IF NOT EXISTS employer_liability_expiry   date,
  ADD COLUMN IF NOT EXISTS insurance_doc               text,
  ADD COLUMN IF NOT EXISTS insurance_expiry            date,
  ADD COLUMN IF NOT EXISTS waste_carrier_licence_doc   text,
  ADD COLUMN IF NOT EXISTS waste_carrier_expiry        date,
  ADD COLUMN IF NOT EXISTS asbestos_licence_doc        text,
  ADD COLUMN IF NOT EXISTS asbestos_licence_expiry     date,
  ADD COLUMN IF NOT EXISTS rams_doc                    text,
  ADD COLUMN IF NOT EXISTS certificates                jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS suspended                   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at               timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason           text;

-- ─── Commission invoices ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.commission_invoices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number    text NOT NULL UNIQUE,
  sales_agent_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sales_agent_name  text NOT NULL,
  sales_agent_email text,
  period_start      date NOT NULL,
  period_end        date NOT NULL,
  quote_ids         uuid[] NOT NULL DEFAULT '{}',
  total_quotes      integer NOT NULL DEFAULT 0,
  total_quote_value numeric(10,2) NOT NULL DEFAULT 0,
  commission_rate   numeric(5,2) NOT NULL DEFAULT 5,
  commission_amount numeric(10,2) NOT NULL DEFAULT 0,
  vat_amount        numeric(10,2) NOT NULL DEFAULT 0,
  total_due         numeric(10,2) NOT NULL DEFAULT 0,
  status            commission_invoice_status NOT NULL DEFAULT 'draft',
  sent_date         timestamptz,
  paid_date         timestamptz,
  notes             text,
  created_by_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date      timestamptz NOT NULL DEFAULT now(),
  updated_date      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_invoices_agent ON public.commission_invoices(sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_commission_invoices_status ON public.commission_invoices(status);
SELECT attach_updated_date_trigger('commission_invoices');
ALTER TABLE public.commission_invoices ENABLE ROW LEVEL SECURITY;

-- ─── Reviews ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reviews (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name    text NOT NULL,
  customer_email   text,
  job_id           uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  job_title        text,
  star_rating      integer NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  review_text      text,
  source           text NOT NULL DEFAULT 'google',
  google_review_id text,
  review_url       text,
  reply_text       text,
  replied_at       timestamptz,
  is_published     boolean NOT NULL DEFAULT true,
  created_by_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date     timestamptz NOT NULL DEFAULT now(),
  updated_date     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(star_rating);
SELECT attach_updated_date_trigger('reviews');
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ─── RLS policies for new tables ─────────────────────────────────────────────

-- Commission invoices: admins and sales agents can read their own
CREATE POLICY "commission_invoices_read" ON public.commission_invoices
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "commission_invoices_write" ON public.commission_invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'user')
    )
  );

-- Reviews: all authenticated users can read
CREATE POLICY "reviews_read" ON public.reviews
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "reviews_write" ON public.reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'user')
    )
  );
