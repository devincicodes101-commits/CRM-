-- Enable Supabase Realtime on the tables that drive live updates.
-- Idempotent: each table is only added to the publication if not already a member.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['messages', 'job_messages', 'jobs', 'leads'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
