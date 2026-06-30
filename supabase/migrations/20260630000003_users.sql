-- Users (public profile table, linked to auth.users)

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

-- Company settings (single-row config for the CRM instance)
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
