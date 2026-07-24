-- Service templates: reusable bundles of services applied to a quote in one click.
CREATE TABLE IF NOT EXISTS public.service_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  items         jsonb NOT NULL DEFAULT '[]',
  created_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_templates_read" ON public.service_templates;
CREATE POLICY "service_templates_read" ON public.service_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "service_templates_write" ON public.service_templates;
CREATE POLICY "service_templates_write" ON public.service_templates
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
