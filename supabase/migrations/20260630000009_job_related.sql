-- Job-related: completions, arrivals, chats, messages, reschedules, extra work, receipts
-- Vehicles and contractors tables exist by now (0007, 0008)

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

CREATE INDEX idx_job_completions_job ON public.job_completions(job_id);
SELECT attach_updated_date_trigger('job_completions');
ALTER TABLE public.job_completions ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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

CREATE INDEX idx_job_arrivals_job ON public.job_arrivals(job_id);
SELECT attach_updated_date_trigger('job_arrivals');
ALTER TABLE public.job_arrivals ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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

CREATE INDEX idx_job_chats_job ON public.job_chats(job_id);
SELECT attach_updated_date_trigger('job_chats');
ALTER TABLE public.job_chats ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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

CREATE INDEX idx_job_messages_job ON public.job_messages(job_id);
SELECT attach_updated_date_trigger('job_messages');
ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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

CREATE INDEX idx_reschedule_job ON public.reschedule_requests(job_id);
SELECT attach_updated_date_trigger('reschedule_requests');
ALTER TABLE public.reschedule_requests ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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

CREATE INDEX idx_extra_work_job ON public.extra_work_requests(job_id);
CREATE INDEX idx_extra_work_contractor ON public.extra_work_requests(contractor_user_id);
SELECT attach_updated_date_trigger('extra_work_requests');
ALTER TABLE public.extra_work_requests ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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

CREATE INDEX idx_receipts_job ON public.receipts(job_id);
SELECT attach_updated_date_trigger('receipts');
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
