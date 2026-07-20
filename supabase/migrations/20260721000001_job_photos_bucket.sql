-- Public storage bucket for customer-uploaded job photos (Job Messages page).
-- Uploads happen server-side via the service-role client (bypasses RLS);
-- a public read policy lets the images be viewed by their URL.

INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "job-photos public read" ON storage.objects;
CREATE POLICY "job-photos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-photos');
