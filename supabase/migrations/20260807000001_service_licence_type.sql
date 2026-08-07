-- Licenced-job routing: give each service a licence classification so a job
-- created from a quote can be flagged requires_licence, which the contractor
-- invite filter already uses to keep licenced jobs away from non-licenced
-- contractors. Also seeds the asbestos service licence data + muck-away service.

-- ─── Service licence classification ──────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE service_licence_type AS ENUM ('non_licenced', 'licenced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS licence_type service_licence_type NOT NULL DEFAULT 'non_licenced';

-- Known asbestos work classifications (per client). Best-effort name matches —
-- anything that doesn't match keeps the safe 'non_licenced' default and can be
-- set on the service edit screen.
UPDATE public.services SET licence_type = 'non_licenced'
  WHERE name ILIKE '%water tank%' OR name ILIKE '%boiler%' OR name ILIKE '%flue%';

UPDATE public.services SET licence_type = 'licenced'
  WHERE name ILIKE '%aib%'
     OR name ILIKE '%asbestos insulating board%'
     OR name ILIKE '%garage ceiling%';

-- ─── Muck-away service (non-licenced disposal) ───────────────────────────────
-- Two price points: £30 per 25kg bag, £450 per cubic ton.
INSERT INTO public.services (name, category, description, unit_price, unit_type, licence_type, is_active)
SELECT 'Muck Away — Bagged (25kg)', 'general', 'Waste removal, per 25kg bag', 30, 'per_unit', 'non_licenced', true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name ILIKE 'Muck Away — Bagged%');

INSERT INTO public.services (name, category, description, unit_price, unit_type, licence_type, is_active)
SELECT 'Muck Away — Bulk (per cubic ton)', 'general', 'Waste removal, per cubic ton', 450, 'per_unit', 'non_licenced', true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name ILIKE 'Muck Away — Bulk%');
