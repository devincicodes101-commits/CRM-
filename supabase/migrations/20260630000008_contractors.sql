-- Contractors, Subcontractors, Job Bids

CREATE TABLE IF NOT EXISTS public.contractors (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name             text,
  contact_name             text NOT NULL,
  email                    text NOT NULL,
  phone                    text,
  address_line1            text,
  address_line2            text,
  address_city             text,
  address_postcode         text,
  bank_account_name        text,
  bank_sort_code           text,
  bank_account_number      text,
  vat_registered           boolean NOT NULL DEFAULT false,
  vat_number               text,
  registration_completed   boolean NOT NULL DEFAULT false,
  created_by_id            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date             timestamptz NOT NULL DEFAULT now(),
  updated_date             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contractors_user ON public.contractors(user_id);
CREATE INDEX idx_contractors_email ON public.contractors(email);
SELECT attach_updated_date_trigger('contractors');
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subcontractors (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  company_name        text,
  email               text NOT NULL,
  phone               text,
  covered_areas       text[] NOT NULL DEFAULT '{}',
  service_categories  text[] NOT NULL DEFAULT '{}',
  starting_postcode   text,
  max_radius_miles    integer,
  status              subcontractor_status NOT NULL DEFAULT 'pending',
  rating              numeric(3,2) NOT NULL DEFAULT 0,
  completed_jobs      integer NOT NULL DEFAULT 0,
  notes               text,
  created_by_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date        timestamptz NOT NULL DEFAULT now(),
  updated_date        timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('subcontractors');
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.job_bids (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                    uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_title                 text,
  job_start_date            timestamptz,
  job_address               text,
  job_description           text,
  subcontractor_id          uuid NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  subcontractor_name        text,
  subcontractor_company     text,
  amount                    numeric(10,2) NOT NULL,
  estimated_days            integer,
  notes                     text,
  status                    bid_status NOT NULL DEFAULT 'pending',
  created_by_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date              timestamptz NOT NULL DEFAULT now(),
  updated_date              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_bids_job ON public.job_bids(job_id);
CREATE INDEX idx_job_bids_subcontractor ON public.job_bids(subcontractor_id);
SELECT attach_updated_date_trigger('job_bids');
ALTER TABLE public.job_bids ENABLE ROW LEVEL SECURITY;
