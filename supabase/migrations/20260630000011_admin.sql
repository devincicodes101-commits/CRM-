-- Admin / config tables: alerts, audit logs, bonus/commission/prize settings,
-- operative bonuses, feedbacks, integration connections, invited users,
-- signup requests, website domains

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

CREATE INDEX idx_alerts_status_type ON public.alerts(status, alert_type);
SELECT attach_updated_date_trigger('alerts');
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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

CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON public.audit_logs(created_date DESC);
SELECT attach_updated_date_trigger('audit_logs');
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────

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

CREATE INDEX idx_op_bonuses_operative_month ON public.operative_bonuses(operative_id, month_year);
SELECT attach_updated_date_trigger('operative_bonuses');
ALTER TABLE public.operative_bonuses ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.integration_connections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_key   text NOT NULL UNIQUE,
  integration_name  text NOT NULL,
  category          integration_category NOT NULL,
  is_connected      boolean NOT NULL DEFAULT false,
  credentials       jsonb,
  -- {api_key, api_secret, client_id, client_secret, publishable_key, phone_number_id, access_token}
  connected_date    timestamptz,
  disconnected_date timestamptz,
  created_by_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date      timestamptz NOT NULL DEFAULT now(),
  updated_date      timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_date_trigger('integration_connections');
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────

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
