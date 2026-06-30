-- Jobs (central operational entity)

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
  -- [{url, caption, uploaded_at}]
  status                job_status NOT NULL DEFAULT 'scheduled',
  priority              job_priority NOT NULL DEFAULT 'medium',
  total_value           numeric(10,2) NOT NULL DEFAULT 0,
  notes                 text,
  color                 text NOT NULL DEFAULT '#f97316',
  reminder_24h_sent     boolean NOT NULL DEFAULT false,
  completed_date        timestamptz,
  materials_used        jsonb NOT NULL DEFAULT '[]',
  -- [{name, quantity, unit, unit_cost}]
  checklist             jsonb NOT NULL DEFAULT '[]',
  -- [{label, checked, notes}]
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

CREATE INDEX idx_jobs_start_date ON public.jobs(start_date);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_contractor ON public.jobs(assigned_contractor_id);
SELECT attach_updated_date_trigger('jobs');
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
