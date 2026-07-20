-- ============================================================================
-- FULL SCHEMA SYNC — idempotent catch-up for a partially-migrated database.
-- Safe to run on a database that already has some tables/enums/policies.
-- Creates whatever is missing; skips whatever already exists.
-- Generated from the repo migrations (base + security + gap-fill + reminder + portal).
-- ============================================================================

DO $$ BEGIN
CREATE TYPE user_role AS ENUM ('admin', 'user', 'operative', 'sales', 'telesales', 'contractor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE alert_type AS ENUM ('low_rating', 'message', 'reminder', 'email_bounce');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE alert_status AS ENUM ('active', 'resolved', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'early_leave');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE client_type AS ENUM ('domestic', 'commercial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE customer_status AS ENUM ('lead', 'active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE email_status AS ENUM ('valid', 'bounced', 'complained');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE email_sequence_type AS ENUM ('new_lead', 'quote_not_booked', 'invoice_not_paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE extra_work_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE invoice_type AS ENUM ('standard', 'deposit', 'progress', 'final', 'credit_note');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'part_paid', 'paid', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE discount_type AS ENUM ('none', 'percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'credit_card', 'direct_debit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE integration_category AS ENUM ('Communications', 'Accounting', 'Payments', 'Calendar', 'Maps');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE invited_dept AS ENUM ('telesales', 'team', 'field', 'subcontractor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE invited_status AS ENUM ('pending', 'accepted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE job_status AS ENUM ('scheduled', 'on_hold', 'in_progress', 'invoiced', 'awaiting_payment', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE job_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE job_chat_role AS ENUM ('admin', 'operative', 'customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE completion_satisfaction AS ENUM ('excellent', 'good', 'satisfactory', 'poor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE job_message_role AS ENUM ('office', 'contractor', 'client');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE lead_source AS ENUM ('facebook', 'instagram', 'tiktok', 'twitter', 'linkedin', 'website_form', 'google_ads', 'referral', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE lead_category AS ENUM ('web_forms', 'social', 'ppc', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'appointment_booked', 'quoted', 'negotiation', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE lead_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE message_sender_type AS ENUM ('customer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE message_status AS ENUM ('open', 'answered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE bonus_status AS ENUM ('pending', 'approved', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE prize_wheel_type AS ENUM ('crm', 'field');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE quote_client_type AS ENUM ('residential', 'commercial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'declined', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE quote_template AS ENUM ('modern', 'classic', 'minimal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE receipt_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE reschedule_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE commission_period AS ENUM ('weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE related_type AS ENUM ('lead', 'quote', 'invoice');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE service_category AS ENUM ('roofing', 'plumbing', 'electrical', 'painting', 'flooring', 'landscaping', 'demolition', 'renovation', 'concrete', 'carpentry', 'insulation', 'asbestos', 'general');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE service_unit_type AS ENUM ('per_sqm', 'per_lm', 'per_hour', 'per_day', 'fixed', 'per_unit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE service_media_type AS ENUM ('ai_generated', 'uploaded', 'linked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE signup_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE subcontractor_status AS ENUM ('pending', 'active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE vehicle_type AS ENUM ('van', 'truck', 'pickup', 'car');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE vehicle_status AS ENUM ('active', 'idle', 'maintenance', 'repair', 'offline');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE website_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE SEQUENCE IF NOT EXISTS quote_number_seq START 1;

CREATE OR REPLACE FUNCTION next_quote_number()
RETURNS text LANGUAGE sql AS $$
  SELECT 'QU-' || LPAD(nextval('quote_number_seq')::text, 5, '0');
$$;

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS text LANGUAGE sql AS $$
  SELECT 'INV-' || LPAD(nextval('invoice_number_seq')::text, 5, '0');
$$;

CREATE OR REPLACE FUNCTION attach_updated_date_trigger(tbl text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format(
    'CREATE OR REPLACE TRIGGER set_updated_date
     BEFORE UPDATE ON %I
     FOR EACH ROW EXECUTE FUNCTION update_updated_date()',
    tbl
  );
END;
$$;

CREATE TABLE IF NOT EXISTS public.users (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        text NOT NULL DEFAULT '',
  email            text NOT NULL,
  role             user_role NOT NULL DEFAULT 'user',
  avatar_url       text,
  nav_permissions  text[] NOT NULL DEFAULT '{}',
  mobile_number    text,
  created_date     timestamptz NOT NULL DEFAULT now(),
  updated_date     timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('users');

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.company_settings (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name               text,
  tagline                    text,
  email                      text,
  sender_email               text,
  phone                      text,
  address                    text,
  city                       text,
  postcode                   text,
  website                    text,
  base_url                   text,
  vat_number                 text,
  company_number             text,
  logo_url                   text,
  primary_color              text NOT NULL DEFAULT '#f97316',
  quote_footer_text          text,
  invoice_footer_text        text,
  bank_account_name          text,
  bank_sort_code             text,
  bank_account_number        text,
  terms_and_conditions       text,
  role_permissions           jsonb NOT NULL DEFAULT '{}',
  opening_time               text NOT NULL DEFAULT '09:00',
  closing_time               text NOT NULL DEFAULT '17:30',
  working_days               integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  business_timezone          text NOT NULL DEFAULT 'Europe/London',
  default_labour_rate        numeric(10,2),
  monthly_marketing_spend    numeric(10,2),
  new_lead_sequence_start_date timestamptz,
  created_by_id              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date               timestamptz NOT NULL DEFAULT now(),
  updated_date               timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('company_settings');

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.customers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  company          text,
  email            text,
  email_status     email_status NOT NULL DEFAULT 'valid',
  phone            text,
  address          text,
  city             text,
  postcode         text,
  notes            text,
  status           customer_status NOT NULL DEFAULT 'lead',
  client_type      client_type NOT NULL DEFAULT 'domestic',
  total_spent      numeric(10,2) NOT NULL DEFAULT 0,
  reviews          jsonb NOT NULL DEFAULT '[]',

  average_rating   numeric(3,2),
  created_by_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date     timestamptz NOT NULL DEFAULT now(),
  updated_date     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers USING gin(to_tsvector('english', name || ' ' || COALESCE(company, '')));

SELECT attach_updated_date_trigger('customers');

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.leads (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     text NOT NULL,
  email                    text,
  phone                    text,
  source                   lead_source,
  category                 lead_category,
  service_interest         text,
  message                  text,
  address                  text,
  status                   lead_status NOT NULL DEFAULT 'new',
  priority                 lead_priority NOT NULL DEFAULT 'medium',
  assigned_to              text,
  assigned_to_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes                    text,
  call_notes               text,
  follow_up_date           timestamptz,
  follow_up_time           text,
  estimated_value          numeric(10,2),
  converted_to_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  converted_to_quote_id    uuid,
  seq_steps_sent           integer[] NOT NULL DEFAULT '{}',
  consent_given            boolean NOT NULL DEFAULT false,
  consent_date             timestamptz,
  created_by_id            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date             timestamptz NOT NULL DEFAULT now(),
  updated_date             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_status_assigned ON public.leads(status, assigned_to_id);

CREATE INDEX IF NOT EXISTS idx_leads_search ON public.leads USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')));

SELECT attach_updated_date_trigger('leads');

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.services (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  category           service_category NOT NULL DEFAULT 'general',
  description        text,
  unit_price         numeric(10,2) NOT NULL,
  unit_type          service_unit_type NOT NULL DEFAULT 'fixed',
  estimated_duration text,
  image_url          text,
  video_prompt       text,
  video_url          text,
  media_type         service_media_type NOT NULL DEFAULT 'ai_generated',
  is_active          boolean NOT NULL DEFAULT true,
  created_by_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date       timestamptz NOT NULL DEFAULT now(),
  updated_date       timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('services');

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quotes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number          text NOT NULL UNIQUE DEFAULT next_quote_number(),
  client_type           quote_client_type NOT NULL DEFAULT 'residential',
  customer_id           uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name         text NOT NULL,
  customer_email        text,
  customer_address      text,
  sales_agent_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sales_agent_name      text,
  items                 jsonb NOT NULL DEFAULT '[]',

  subtotal              numeric(10,2) NOT NULL DEFAULT 0,
  discount_type         discount_type NOT NULL DEFAULT 'none',
  discount_value        numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount       numeric(10,2) NOT NULL DEFAULT 0,
  vat_rate              numeric(5,2) NOT NULL DEFAULT 20,
  vat_amount            numeric(10,2) NOT NULL DEFAULT 0,
  total                 numeric(10,2) NOT NULL DEFAULT 0,
  notes                 text,
  status                quote_status NOT NULL DEFAULT 'draft',
  valid_until           timestamptz,
  template_style        quote_template NOT NULL DEFAULT 'modern',
  sent_date             timestamptz,
  discount_email_sent   boolean NOT NULL DEFAULT false,
  followup_day7_sent    boolean NOT NULL DEFAULT false,
  followup_day14_sent   boolean NOT NULL DEFAULT false,
  reminder_date         timestamptz,
  reminder_time         text,
  reminder_note         text,
  reminder_done         boolean NOT NULL DEFAULT false,
  images                text[] NOT NULL DEFAULT '{}',
  created_by_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date          timestamptz NOT NULL DEFAULT now(),
  updated_date          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);

CREATE INDEX IF NOT EXISTS idx_quotes_customer ON public.quotes(customer_id);

SELECT attach_updated_date_trigger('quotes');

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.leads ADD CONSTRAINT fk_leads_quote
  FOREIGN KEY (converted_to_quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.invoices (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number   text NOT NULL UNIQUE DEFAULT next_invoice_number(),
  quote_id         uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  customer_id      uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name    text NOT NULL,
  customer_email   text,
  customer_address text,
  invoice_type     invoice_type NOT NULL DEFAULT 'standard',
  billed_amount    numeric(10,2),
  items            jsonb NOT NULL DEFAULT '[]',

  subtotal         numeric(10,2) NOT NULL DEFAULT 0,
  discount_type    discount_type NOT NULL DEFAULT 'none',
  discount_value   numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount  numeric(10,2) NOT NULL DEFAULT 0,
  vat_rate         numeric(5,2) NOT NULL DEFAULT 20,
  vat_amount       numeric(10,2) NOT NULL DEFAULT 0,
  total            numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid      numeric(10,2) NOT NULL DEFAULT 0,
  notes            text,
  status           invoice_status NOT NULL DEFAULT 'draft',
  due_date         timestamptz,
  sent_date        timestamptz,
  paid_date        timestamptz,
  payment_method   payment_method,
  attachments      jsonb NOT NULL DEFAULT '[]',

  created_by_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date     timestamptz NOT NULL DEFAULT now(),
  updated_date     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);

SELECT attach_updated_date_trigger('invoices');

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.jobs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text NOT NULL,
  customer_id           uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name         text,
  customer_email        text,
  quote_id              uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  address               text,
  description           text,
  start_date            timestamptz NOT NULL,
  end_date              timestamptz,
  start_time            text,
  end_time              text,
  assigned_vehicle      text,
  assigned_team         text,
  assigned_contractor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message_token         text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  client_photos         jsonb NOT NULL DEFAULT '[]',

  status                job_status NOT NULL DEFAULT 'scheduled',
  priority              job_priority NOT NULL DEFAULT 'medium',
  total_value           numeric(10,2) NOT NULL DEFAULT 0,
  notes                 text,
  color                 text NOT NULL DEFAULT '#f97316',
  reminder_24h_sent     boolean NOT NULL DEFAULT false,
  completed_date        timestamptz,
  materials_used        jsonb NOT NULL DEFAULT '[]',

  checklist             jsonb NOT NULL DEFAULT '[]',

  check_in_time         timestamptz,
  check_out_time        timestamptz,
  check_in_lat          double precision,
  check_in_lng          double precision,
  arrival_confirmed     boolean NOT NULL DEFAULT false,
  arrival_distance_m    integer,
  arrival_note          text,
  site_lat              double precision,
  site_lng              double precision,
  created_by_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date          timestamptz NOT NULL DEFAULT now(),
  updated_date          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_start_date ON public.jobs(start_date);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);

CREATE INDEX IF NOT EXISTS idx_jobs_contractor ON public.jobs(assigned_contractor_id);

SELECT attach_updated_date_trigger('jobs');

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.vehicles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  registration          text NOT NULL,
  make                  text,
  model                 text,
  type                  vehicle_type NOT NULL DEFAULT 'van',
  driver                text,
  status                vehicle_status NOT NULL DEFAULT 'idle',
  current_lat           double precision,
  current_lng           double precision,
  current_location_name text,
  speed                 numeric(6,2) NOT NULL DEFAULT 0,
  last_updated          timestamptz,
  assigned_job          uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  fuel_level            integer NOT NULL DEFAULT 100,
  mileage               integer NOT NULL DEFAULT 0,
  service_due_date      timestamptz,
  mot_due_date          timestamptz,
  insurance_expiry_date timestamptz,
  created_by_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date          timestamptz NOT NULL DEFAULT now(),
  updated_date          timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('vehicles');

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.attendance (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operative_name  text NOT NULL,
  operative_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  attendance_date date NOT NULL,
  clock_in_time   timestamptz,
  clock_out_time  timestamptz,
  hours_worked    numeric(5,2),
  status          attendance_status NOT NULL DEFAULT 'present',
  notes           text,
  created_by_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date    timestamptz NOT NULL DEFAULT now(),
  updated_date    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_operative_date ON public.attendance(operative_id, attendance_date);

SELECT attach_updated_date_trigger('attendance');

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX IF NOT EXISTS idx_contractors_user ON public.contractors(user_id);

CREATE INDEX IF NOT EXISTS idx_contractors_email ON public.contractors(email);

SELECT attach_updated_date_trigger('contractors');

ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX IF NOT EXISTS idx_job_bids_job ON public.job_bids(job_id);

CREATE INDEX IF NOT EXISTS idx_job_bids_subcontractor ON public.job_bids(subcontractor_id);

SELECT attach_updated_date_trigger('job_bids');

ALTER TABLE public.job_bids ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.job_completions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                 uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_title              text,
  customer_name          text NOT NULL,
  customer_email         text,
  customer_signature     text,
  customer_satisfaction  completion_satisfaction,
  customer_comments      text,
  star_rating            integer CHECK (star_rating BETWEEN 1 AND 5),
  feedback               text,
  operative_name         text,
  completed_date         timestamptz,
  invoice_id             uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  invoice_number         text,
  photos                 text[] NOT NULL DEFAULT '{}',
  video_url              text,
  customer_signed_off    boolean NOT NULL DEFAULT false,
  thank_you_email_sent   boolean NOT NULL DEFAULT false,
  created_by_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date           timestamptz NOT NULL DEFAULT now(),
  updated_date           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_completions_job ON public.job_completions(job_id);

SELECT attach_updated_date_trigger('job_completions');

ALTER TABLE public.job_completions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.job_arrivals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  vehicle_id     uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  arrival_lat    double precision NOT NULL,
  arrival_lng    double precision NOT NULL,
  arrival_time   timestamptz NOT NULL,
  invoice_sent   boolean NOT NULL DEFAULT false,
  created_by_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date   timestamptz NOT NULL DEFAULT now(),
  updated_date   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_arrivals_job ON public.job_arrivals(job_id);

SELECT attach_updated_date_trigger('job_arrivals');

ALTER TABLE public.job_arrivals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.job_chats (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_title     text,
  job_date      timestamptz,
  sender_name   text NOT NULL,
  sender_role   job_chat_role,
  message       text NOT NULL,
  is_read       boolean NOT NULL DEFAULT false,
  created_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_chats_job ON public.job_chats(job_id);

SELECT attach_updated_date_trigger('job_chats');

ALTER TABLE public.job_chats ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.job_messages (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                      uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_title                   text,
  sender_role                 job_message_role NOT NULL,
  sender_name                 text,
  body                        text NOT NULL,
  assigned_contractor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_id               uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date                timestamptz NOT NULL DEFAULT now(),
  updated_date                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_messages_job ON public.job_messages(job_id);

SELECT attach_updated_date_trigger('job_messages');

ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.reschedule_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  customer_name  text NOT NULL,
  job_title      text,
  original_date  timestamptz,
  requested_date timestamptz,
  reason         text,
  status         reschedule_status NOT NULL DEFAULT 'pending',
  notes          text,
  request_date   timestamptz NOT NULL DEFAULT now(),
  created_by_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date   timestamptz NOT NULL DEFAULT now(),
  updated_date   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reschedule_job ON public.reschedule_requests(job_id);

SELECT attach_updated_date_trigger('reschedule_requests');

ALTER TABLE public.reschedule_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.extra_work_requests (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_title             text,
  contractor_id         uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  contractor_user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contractor_name       text,
  description           text NOT NULL,
  amount                numeric(10,2) NOT NULL,
  status                extra_work_status NOT NULL DEFAULT 'pending',
  decided_at            timestamptz,
  decided_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date          timestamptz NOT NULL DEFAULT now(),
  updated_date          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_extra_work_job ON public.extra_work_requests(job_id);

CREATE INDEX IF NOT EXISTS idx_extra_work_contractor ON public.extra_work_requests(contractor_user_id);

SELECT attach_updated_date_trigger('extra_work_requests');

ALTER TABLE public.extra_work_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.receipts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  operative_name   text NOT NULL,
  photo_url        text NOT NULL,
  amount_gbp       numeric(10,2),
  item_description text,
  purchase_date    timestamptz,
  notes            text,
  status           receipt_status NOT NULL DEFAULT 'pending',
  created_by_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date     timestamptz NOT NULL DEFAULT now(),
  updated_date     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_job ON public.receipts(job_id);

SELECT attach_updated_date_trigger('receipts');

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.internal_chats (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel       text NOT NULL,
  sender_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name   text NOT NULL,
  sender_role   text,
  sender_avatar text,
  message       text NOT NULL,
  is_read_by    text[] NOT NULL DEFAULT '{}',
  created_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_chats_channel ON public.internal_chats(channel, created_date);

SELECT attach_updated_date_trigger('internal_chats');

ALTER TABLE public.internal_chats ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  quote_id        uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  customer_email  text NOT NULL,
  customer_name   text NOT NULL,
  subject         text,
  content         text NOT NULL,
  sender_type     message_sender_type NOT NULL,
  is_read         boolean NOT NULL DEFAULT false,
  status          message_status NOT NULL DEFAULT 'open',
  conversation_id uuid,
  created_by_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date    timestamptz NOT NULL DEFAULT now(),
  updated_date    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);

SELECT attach_updated_date_trigger('messages');

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.staff_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email    text NOT NULL,
  from_name     text,
  to_email      text NOT NULL,
  subject       text NOT NULL,
  body          text NOT NULL,
  is_read       boolean NOT NULL DEFAULT false,
  thread_id     uuid,
  created_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('staff_messages');

ALTER TABLE public.staff_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.email_sequences (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_type  email_sequence_type NOT NULL,
  step           integer NOT NULL,
  delay_days     integer NOT NULL,
  subject        text NOT NULL,
  body           text NOT NULL,
  is_active      boolean NOT NULL DEFAULT true,
  label          text,
  created_by_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date   timestamptz NOT NULL DEFAULT now(),
  updated_date   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sequence_type, step)
);

SELECT attach_updated_date_trigger('email_sequences');

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.sequence_email_logs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_type      email_sequence_type NOT NULL,
  step_number        integer NOT NULL,
  step_label         text,
  recipient_email    text NOT NULL,
  recipient_name     text,
  related_id         uuid,
  related_type       related_type,
  subject            text,
  sent_date          timestamptz NOT NULL,
  resend_message_id  text,
  opened             boolean NOT NULL DEFAULT false,
  opened_date        timestamptz,
  clicked            boolean NOT NULL DEFAULT false,
  clicked_date       timestamptz,
  replied            boolean NOT NULL DEFAULT false,
  replied_date       timestamptz,
  created_by_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date       timestamptz NOT NULL DEFAULT now(),
  updated_date       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seq_logs_related ON public.sequence_email_logs(related_id);

CREATE INDEX IF NOT EXISTS idx_seq_logs_resend ON public.sequence_email_logs(resend_message_id);

SELECT attach_updated_date_trigger('sequence_email_logs');

ALTER TABLE public.sequence_email_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.alerts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type       alert_type NOT NULL,
  title            text NOT NULL,
  message          text NOT NULL,
  job_id           uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  customer_id      uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name    text,
  customer_email   text,
  feedback_id      uuid,
  star_rating      integer,
  feedback_text    text,
  status           alert_status NOT NULL DEFAULT 'active',
  resolved_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_date    timestamptz,
  resolution_notes text,
  created_by_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date     timestamptz NOT NULL DEFAULT now(),
  updated_date     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_status_type ON public.alerts(status, alert_type);

SELECT attach_updated_date_trigger('alerts');

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name      text,
  user_email     text,
  action         audit_action NOT NULL,
  entity_type    text NOT NULL,
  entity_id      uuid,
  entity_name    text,
  details        text,
  changed_fields text[] NOT NULL DEFAULT '{}',
  created_by_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date   timestamptz NOT NULL DEFAULT now(),
  updated_date   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_date ON public.audit_logs(created_date DESC);

SELECT attach_updated_date_trigger('audit_logs');

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.bonus_settings (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name                  text,
  min_star_rating            numeric(3,2) NOT NULL,
  min_jobs_completed         integer,
  max_completion_days        integer,
  min_attendance_percentage  numeric(5,2) CHECK (min_attendance_percentage BETWEEN 0 AND 100),
  bonus_amount_gbp           numeric(10,2) NOT NULL,
  is_active                  boolean NOT NULL DEFAULT true,
  priority                   integer NOT NULL DEFAULT 0,
  created_by_id              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date               timestamptz NOT NULL DEFAULT now(),
  updated_date               timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('bonus_settings');

ALTER TABLE public.bonus_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.commission_settings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_percent         numeric(5,2) NOT NULL DEFAULT 5,
  qualifying_statuses  text[] NOT NULL DEFAULT '{accepted}',
  period               commission_period NOT NULL DEFAULT 'weekly',
  created_by_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date         timestamptz NOT NULL DEFAULT now(),
  updated_date         timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('commission_settings');

ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.operative_bonuses (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operative_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operative_name        text NOT NULL,
  month_year            text NOT NULL,
  base_bonus            numeric(10,2) NOT NULL DEFAULT 0,
  star_rating_bonus     numeric(10,2) NOT NULL DEFAULT 0,
  job_performance_bonus numeric(10,2) NOT NULL DEFAULT 0,
  attendance_bonus      numeric(10,2) NOT NULL DEFAULT 0,
  total_bonus           numeric(10,2) NOT NULL DEFAULT 0,
  status                bonus_status NOT NULL DEFAULT 'pending',
  notes                 text,
  created_by_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date          timestamptz NOT NULL DEFAULT now(),
  updated_date          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_op_bonuses_operative_month ON public.operative_bonuses(operative_id, month_year);

SELECT attach_updated_date_trigger('operative_bonuses');

ALTER TABLE public.operative_bonuses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.prize_settings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_type        prize_wheel_type NOT NULL,
  prize_description text NOT NULL,
  prize_emoji       text,
  is_active         boolean NOT NULL DEFAULT true,
  created_by_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date      timestamptz NOT NULL DEFAULT now(),
  updated_date      timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('prize_settings');

ALTER TABLE public.prize_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.feedbacks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name  text NOT NULL,
  customer_email text,
  job_id         uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  job_title      text,
  star_rating    integer NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  feedback_text  text NOT NULL,
  submitted_date timestamptz NOT NULL DEFAULT now(),
  created_by_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date   timestamptz NOT NULL DEFAULT now(),
  updated_date   timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('feedbacks');

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.integration_connections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_key   text NOT NULL UNIQUE,
  integration_name  text NOT NULL,
  category          integration_category NOT NULL,
  is_connected      boolean NOT NULL DEFAULT false,
  credentials       jsonb,

  connected_date    timestamptz,
  disconnected_date timestamptz,
  created_by_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date      timestamptz NOT NULL DEFAULT now(),
  updated_date      timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('integration_connections');

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.invited_users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  email          text NOT NULL,
  department     invited_dept NOT NULL,
  role           text,
  status         invited_status NOT NULL DEFAULT 'pending',
  created_by_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date   timestamptz NOT NULL DEFAULT now(),
  updated_date   timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('invited_users');

ALTER TABLE public.invited_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.signup_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operative_name   text NOT NULL,
  email            text NOT NULL,
  status           signup_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  approved_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_date    timestamptz,
  created_by_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date     timestamptz NOT NULL DEFAULT now(),
  updated_date     timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('signup_requests');

ALTER TABLE public.signup_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.website_domains (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name           text NOT NULL,
  domain_url            text NOT NULL,
  status                website_status NOT NULL DEFAULT 'active',
  google_analytics_id   text,
  seo_focus_keywords    text[] NOT NULL DEFAULT '{}',
  monthly_traffic_goal  integer,
  notes                 text,
  created_date_domain   timestamptz,
  created_by_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date          timestamptz NOT NULL DEFAULT now(),
  updated_date          timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('website_domains');

ALTER TABLE public.website_domains ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_admin_or_sales()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales', 'telesales')
  );
$$;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "users: auth users can read all" ON public.users;
CREATE POLICY "users: auth users can read all"
  ON public.users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users: own row update" ON public.users;
CREATE POLICY "users: own row update"
  ON public.users FOR UPDATE TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "users: admin full access" ON public.users;
CREATE POLICY "users: admin full access"
  ON public.users FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "company_settings: auth read" ON public.company_settings;
CREATE POLICY "company_settings: auth read"
  ON public.company_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "company_settings: admin write" ON public.company_settings;
CREATE POLICY "company_settings: admin write"
  ON public.company_settings FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "customers: auth read" ON public.customers;
CREATE POLICY "customers: auth read"
  ON public.customers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "customers: auth insert" ON public.customers;
CREATE POLICY "customers: auth insert"
  ON public.customers FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "customers: admin/sales update" ON public.customers;
CREATE POLICY "customers: admin/sales update"
  ON public.customers FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'sales', 'telesales', 'user'));

DROP POLICY IF EXISTS "customers: admin delete" ON public.customers;
CREATE POLICY "customers: admin delete"
  ON public.customers FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "leads: auth read" ON public.leads;
CREATE POLICY "leads: auth read"
  ON public.leads FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "leads: auth insert" ON public.leads;
CREATE POLICY "leads: auth insert"
  ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "leads: update own or admin/sales" ON public.leads;
CREATE POLICY "leads: update own or admin/sales"
  ON public.leads FOR UPDATE TO authenticated
  USING (assigned_to_id = auth.uid() OR current_user_role() IN ('admin', 'sales', 'telesales'));

DROP POLICY IF EXISTS "leads: admin delete" ON public.leads;
CREATE POLICY "leads: admin delete"
  ON public.leads FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "services: auth read" ON public.services;
CREATE POLICY "services: auth read"
  ON public.services FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "services: admin write" ON public.services;
CREATE POLICY "services: admin write"
  ON public.services FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "quotes: auth read" ON public.quotes;
CREATE POLICY "quotes: auth read"
  ON public.quotes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "quotes: auth insert" ON public.quotes;
CREATE POLICY "quotes: auth insert"
  ON public.quotes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "quotes: auth update" ON public.quotes;
CREATE POLICY "quotes: auth update"
  ON public.quotes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "quotes: admin delete" ON public.quotes;
CREATE POLICY "quotes: admin delete"
  ON public.quotes FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "invoices: auth read" ON public.invoices;
CREATE POLICY "invoices: auth read"
  ON public.invoices FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "invoices: auth insert" ON public.invoices;
CREATE POLICY "invoices: auth insert"
  ON public.invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "invoices: auth update" ON public.invoices;
CREATE POLICY "invoices: auth update"
  ON public.invoices FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "invoices: admin delete" ON public.invoices;
CREATE POLICY "invoices: admin delete"
  ON public.invoices FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "jobs: auth read" ON public.jobs;
CREATE POLICY "jobs: auth read"
  ON public.jobs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "jobs: admin/manager insert" ON public.jobs;
CREATE POLICY "jobs: admin/manager insert"
  ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'user'));

DROP POLICY IF EXISTS "jobs: admin/operative update" ON public.jobs;
CREATE POLICY "jobs: admin/operative update"
  ON public.jobs FOR UPDATE TO authenticated
  USING (
    current_user_role() IN ('admin', 'user')
    OR assigned_contractor_id = auth.uid()
  );

DROP POLICY IF EXISTS "jobs: admin delete" ON public.jobs;
CREATE POLICY "jobs: admin delete"
  ON public.jobs FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "job_completions: auth read" ON public.job_completions;
CREATE POLICY "job_completions: auth read"
  ON public.job_completions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "job_completions: auth insert" ON public.job_completions;
CREATE POLICY "job_completions: auth insert"
  ON public.job_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "job_completions: auth update" ON public.job_completions;
CREATE POLICY "job_completions: auth update"
  ON public.job_completions FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "job_arrivals: auth read" ON public.job_arrivals;
CREATE POLICY "job_arrivals: auth read"
  ON public.job_arrivals FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "job_arrivals: auth insert" ON public.job_arrivals;
CREATE POLICY "job_arrivals: auth insert"
  ON public.job_arrivals FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "job_chats: auth read" ON public.job_chats;
CREATE POLICY "job_chats: auth read"
  ON public.job_chats FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "job_chats: auth insert" ON public.job_chats;
CREATE POLICY "job_chats: auth insert"
  ON public.job_chats FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "job_messages: auth read" ON public.job_messages;
CREATE POLICY "job_messages: auth read"
  ON public.job_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "job_messages: auth insert" ON public.job_messages;
CREATE POLICY "job_messages: auth insert"
  ON public.job_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "reschedule_requests: auth read" ON public.reschedule_requests;
CREATE POLICY "reschedule_requests: auth read"
  ON public.reschedule_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "reschedule_requests: auth insert" ON public.reschedule_requests;
CREATE POLICY "reschedule_requests: auth insert"
  ON public.reschedule_requests FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "reschedule_requests: admin update" ON public.reschedule_requests;
CREATE POLICY "reschedule_requests: admin update"
  ON public.reschedule_requests FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'user'));

DROP POLICY IF EXISTS "extra_work_requests: auth read" ON public.extra_work_requests;
CREATE POLICY "extra_work_requests: auth read"
  ON public.extra_work_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "extra_work_requests: contractor insert" ON public.extra_work_requests;
CREATE POLICY "extra_work_requests: contractor insert"
  ON public.extra_work_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "extra_work_requests: admin decide" ON public.extra_work_requests;
CREATE POLICY "extra_work_requests: admin decide"
  ON public.extra_work_requests FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'user'));

DROP POLICY IF EXISTS "receipts: auth read" ON public.receipts;
CREATE POLICY "receipts: auth read"
  ON public.receipts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "receipts: auth insert" ON public.receipts;
CREATE POLICY "receipts: auth insert"
  ON public.receipts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "receipts: admin decide" ON public.receipts;
CREATE POLICY "receipts: admin decide"
  ON public.receipts FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'user'));

DROP POLICY IF EXISTS "vehicles: auth read" ON public.vehicles;
CREATE POLICY "vehicles: auth read"
  ON public.vehicles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "vehicles: admin write" ON public.vehicles;
CREATE POLICY "vehicles: admin write"
  ON public.vehicles FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "attendance: auth read" ON public.attendance;
CREATE POLICY "attendance: auth read"
  ON public.attendance FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "attendance: auth insert" ON public.attendance;
CREATE POLICY "attendance: auth insert"
  ON public.attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "attendance: admin update" ON public.attendance;
CREATE POLICY "attendance: admin update"
  ON public.attendance FOR UPDATE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "contractors: auth read" ON public.contractors;
CREATE POLICY "contractors: auth read"
  ON public.contractors FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "contractors: admin insert" ON public.contractors;
CREATE POLICY "contractors: admin insert"
  ON public.contractors FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'user'));

DROP POLICY IF EXISTS "contractors: own or admin update" ON public.contractors;
CREATE POLICY "contractors: own or admin update"
  ON public.contractors FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "contractors: admin delete" ON public.contractors;
CREATE POLICY "contractors: admin delete"
  ON public.contractors FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "subcontractors: auth read" ON public.subcontractors;
CREATE POLICY "subcontractors: auth read"
  ON public.subcontractors FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "subcontractors: admin write" ON public.subcontractors;
CREATE POLICY "subcontractors: admin write"
  ON public.subcontractors FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "job_bids: auth read" ON public.job_bids;
CREATE POLICY "job_bids: auth read"
  ON public.job_bids FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "job_bids: subcontractor insert" ON public.job_bids;
CREATE POLICY "job_bids: subcontractor insert"
  ON public.job_bids FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "job_bids: admin decide" ON public.job_bids;
CREATE POLICY "job_bids: admin decide"
  ON public.job_bids FOR UPDATE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "internal_chats: auth read" ON public.internal_chats;
CREATE POLICY "internal_chats: auth read"
  ON public.internal_chats FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "internal_chats: auth insert" ON public.internal_chats;
CREATE POLICY "internal_chats: auth insert"
  ON public.internal_chats FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "messages: auth read" ON public.messages;
CREATE POLICY "messages: auth read"
  ON public.messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "messages: auth insert" ON public.messages;
CREATE POLICY "messages: auth insert"
  ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "messages: auth update" ON public.messages;
CREATE POLICY "messages: auth update"
  ON public.messages FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "staff_messages: auth read" ON public.staff_messages;
CREATE POLICY "staff_messages: auth read"
  ON public.staff_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "staff_messages: auth insert" ON public.staff_messages;
CREATE POLICY "staff_messages: auth insert"
  ON public.staff_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "email_sequences: auth read" ON public.email_sequences;
CREATE POLICY "email_sequences: auth read"
  ON public.email_sequences FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "email_sequences: admin write" ON public.email_sequences;
CREATE POLICY "email_sequences: admin write"
  ON public.email_sequences FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "sequence_email_logs: auth read" ON public.sequence_email_logs;
CREATE POLICY "sequence_email_logs: auth read"
  ON public.sequence_email_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "sequence_email_logs: system insert" ON public.sequence_email_logs;
CREATE POLICY "sequence_email_logs: system insert"
  ON public.sequence_email_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "sequence_email_logs: system update" ON public.sequence_email_logs;
CREATE POLICY "sequence_email_logs: system update"
  ON public.sequence_email_logs FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "alerts: auth read" ON public.alerts;
CREATE POLICY "alerts: auth read"
  ON public.alerts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "alerts: system insert" ON public.alerts;
CREATE POLICY "alerts: system insert"
  ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "alerts: auth update" ON public.alerts;
CREATE POLICY "alerts: auth update"
  ON public.alerts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "audit_logs: admin read" ON public.audit_logs;
CREATE POLICY "audit_logs: admin read"
  ON public.audit_logs FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "audit_logs: system insert" ON public.audit_logs;
CREATE POLICY "audit_logs: system insert"
  ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "bonus_settings: auth read" ON public.bonus_settings;
CREATE POLICY "bonus_settings: auth read"
  ON public.bonus_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "bonus_settings: admin write" ON public.bonus_settings;
CREATE POLICY "bonus_settings: admin write"
  ON public.bonus_settings FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "commission_settings: auth read" ON public.commission_settings;
CREATE POLICY "commission_settings: auth read"
  ON public.commission_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "commission_settings: admin write" ON public.commission_settings;
CREATE POLICY "commission_settings: admin write"
  ON public.commission_settings FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "operative_bonuses: auth read" ON public.operative_bonuses;
CREATE POLICY "operative_bonuses: auth read"
  ON public.operative_bonuses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "operative_bonuses: admin write" ON public.operative_bonuses;
CREATE POLICY "operative_bonuses: admin write"
  ON public.operative_bonuses FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "prize_settings: auth read" ON public.prize_settings;
CREATE POLICY "prize_settings: auth read"
  ON public.prize_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "prize_settings: admin write" ON public.prize_settings;
CREATE POLICY "prize_settings: admin write"
  ON public.prize_settings FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "feedbacks: auth read" ON public.feedbacks;
CREATE POLICY "feedbacks: auth read"
  ON public.feedbacks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "feedbacks: public insert" ON public.feedbacks;
CREATE POLICY "feedbacks: public insert"
  ON public.feedbacks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "integration_connections: auth read" ON public.integration_connections;
CREATE POLICY "integration_connections: auth read"
  ON public.integration_connections FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "integration_connections: admin write" ON public.integration_connections;
CREATE POLICY "integration_connections: admin write"
  ON public.integration_connections FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "invited_users: admin read" ON public.invited_users;
CREATE POLICY "invited_users: admin read"
  ON public.invited_users FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "invited_users: admin write" ON public.invited_users;
CREATE POLICY "invited_users: admin write"
  ON public.invited_users FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "signup_requests: public insert" ON public.signup_requests;
CREATE POLICY "signup_requests: public insert"
  ON public.signup_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "signup_requests: admin read/manage" ON public.signup_requests;
CREATE POLICY "signup_requests: admin read/manage"
  ON public.signup_requests FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "website_domains: auth read" ON public.website_domains;
CREATE POLICY "website_domains: auth read"
  ON public.website_domains FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "website_domains: admin write" ON public.website_domains;
CREATE POLICY "website_domains: admin write"
  ON public.website_domains FOR ALL TO authenticated USING (is_admin());

ALTER TABLE public.contractors
  ADD CONSTRAINT contractors_user_id_key UNIQUE (user_id);

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_admin_or_sales()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales', 'telesales')
  );
$$;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION prevent_self_role_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  claims_role text := COALESCE(
    (current_setting('request.jwt.claims', true)::json ->> 'role'), ''
  );
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role
      OR NEW.nav_permissions IS DISTINCT FROM OLD.nav_permissions)
     AND claims_role <> 'service_role'
     AND NOT is_admin()
  THEN
    RAISE EXCEPTION 'Only admins can change role or permissions';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_block_self_role_change ON public.users;

CREATE OR REPLACE TRIGGER users_block_self_role_change
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION prevent_self_role_escalation();

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS public_token text;

UPDATE public.quotes
  SET public_token = encode(gen_random_bytes(16), 'hex')
  WHERE public_token IS NULL;

ALTER TABLE public.quotes
  ALTER COLUMN public_token SET DEFAULT encode(gen_random_bytes(16), 'hex');

ALTER TABLE public.quotes
  ALTER COLUMN public_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS quotes_public_token_key
  ON public.quotes (public_token);

DROP POLICY IF EXISTS "quotes: auth update" ON public.quotes;

DROP POLICY IF EXISTS "quotes: staff update" ON public.quotes;
CREATE POLICY "quotes: staff update"
  ON public.quotes FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'user', 'sales', 'telesales'));

DROP POLICY IF EXISTS "invoices: auth update" ON public.invoices;

DROP POLICY IF EXISTS "invoices: staff update" ON public.invoices;
CREATE POLICY "invoices: staff update"
  ON public.invoices FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'user', 'sales', 'telesales'));

DROP POLICY IF EXISTS "messages: auth update" ON public.messages;

DROP POLICY IF EXISTS "messages: staff update" ON public.messages;
CREATE POLICY "messages: staff update"
  ON public.messages FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'user', 'sales', 'telesales'));

DROP POLICY IF EXISTS "audit_logs: system insert" ON public.audit_logs;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requested text := NEW.raw_user_meta_data ->> 'role';
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    CASE
      WHEN requested IN ('user', 'contractor') THEN requested::user_role
      ELSE 'user'::user_role
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

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

DROP POLICY IF EXISTS "commission_invoices_read" ON public.commission_invoices;
CREATE POLICY "commission_invoices_read" ON public.commission_invoices
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "commission_invoices_write" ON public.commission_invoices;
CREATE POLICY "commission_invoices_write" ON public.commission_invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'user')
    )
  );

DROP POLICY IF EXISTS "reviews_read" ON public.reviews;
CREATE POLICY "reviews_read" ON public.reviews
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "reviews_write" ON public.reviews;
CREATE POLICY "reviews_write" ON public.reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'user')
    )
  );

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS last_reminder_sent timestamptz;

ALTER TABLE public.commission_invoices
  ADD COLUMN IF NOT EXISTS last_reminder_sent timestamptz;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS portal_token text;

UPDATE public.customers
  SET portal_token = encode(gen_random_bytes(16), 'hex')
  WHERE portal_token IS NULL;

ALTER TABLE public.customers
  ALTER COLUMN portal_token SET DEFAULT encode(gen_random_bytes(16), 'hex');

ALTER TABLE public.customers
  ALTER COLUMN portal_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customers_portal_token_key
  ON public.customers (portal_token);
