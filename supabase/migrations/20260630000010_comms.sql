-- Communications: internal chats, messages, staff messages, email sequences, sequence logs

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

CREATE INDEX idx_internal_chats_channel ON public.internal_chats(channel, created_date);
SELECT attach_updated_date_trigger('internal_chats');
ALTER TABLE public.internal_chats ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
SELECT attach_updated_date_trigger('messages');
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────

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

CREATE INDEX idx_seq_logs_related ON public.sequence_email_logs(related_id);
CREATE INDEX idx_seq_logs_resend ON public.sequence_email_logs(resend_message_id);
SELECT attach_updated_date_trigger('sequence_email_logs');
ALTER TABLE public.sequence_email_logs ENABLE ROW LEVEL SECURITY;
