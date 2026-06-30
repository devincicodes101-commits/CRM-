-- Vehicles and Attendance (no deps on contractors)

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

-- ─────────────────────────────────────────────────────────────

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

CREATE INDEX idx_attendance_operative_date ON public.attendance(operative_id, attendance_date);
SELECT attach_updated_date_trigger('attendance');
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
