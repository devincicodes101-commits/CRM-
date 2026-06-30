-- Core CRM tables: customers, leads, services

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
  -- reviews shape: [{rating, feedback, job_title, date}]
  average_rating   numeric(3,2),
  created_by_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date     timestamptz NOT NULL DEFAULT now(),
  updated_date     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_name ON public.customers USING gin(to_tsvector('english', name || ' ' || COALESCE(company, '')));
SELECT attach_updated_date_trigger('customers');
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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

CREATE INDEX idx_leads_status_assigned ON public.leads(status, assigned_to_id);
CREATE INDEX idx_leads_search ON public.leads USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')));
SELECT attach_updated_date_trigger('leads');
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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
