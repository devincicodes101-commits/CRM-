-- Seed the real Asbestos UK Teams service catalogue (exported from Base44).
-- Idempotent: each service is only inserted if a service with that name doesn't
-- already exist, so it's safe to run more than once.

insert into public.services (name, category, description, unit_price, unit_type, estimated_duration, is_active, media_type)
select v.name, v.category::service_category, v.description, v.unit_price, v.unit_type::service_unit_type, v.estimated_duration, true, 'ai_generated'::service_media_type
from (values
  ('Aib Soffits/Canopy Area ( Licensed) Price Per Linear M2', 'general', 'Full removal and disposal of soffit boards from the property. Scaffolding to be provided by the client or contractor on site. Price includes HSE notification, 2 men 2 days labour, E11 environmental clean certification and waste disposal certification on completion. Price is based per linear metre.', 145, 'per_unit', ''),
  ('Asbestos Artex Removal', 'asbestos', 'Full removal and disposal of asbestos artex. Price includes waste certificate on completion.', 45, 'per_sqm', '1'),
  ('Asbestos Boiler Removal', 'general', 'Asbestos lined boiler (encased). Price includes full removal and disposal and waste consignment note. Each room covered with 1200 gauge polymer plastic to prevent the spread of contaminated dust.', 450, 'fixed', 'Half Day'),
  ('Asbestos Corrugated Sheet Collection', 'general', 'Asbestos corrugated sheet collection. Price includes collection and disposal and waste consignment note. Based on minimum call-out charge for 10 sheet collection. Negotiable on quantities over 100 sheets.', 30, 'per_unit', ''),
  ('Asbestos Floor Tile Removal', 'asbestos', 'Full removal and disposal of asbestos floor tiles. Excludes bitumen resin removal. Includes waste consignment note on completion and full environmental clean.', 45, 'per_sqm', '1'),
  ('Asbestos Loft Insulation Removal Vermiculite', 'general', 'Asbestos loft insulation per M2. Price includes full removal and disposal and waste consignment note. Loft covered with 1200 gauge polymer plastic to prevent the spread of contaminated dust.', 55, 'per_sqm', '1'),
  ('Asbestos Single Roof Removal', 'asbestos', 'Full removal and disposal of an existing asbestos garage roof. Price includes legal waste certificate 1 day after completion and a full environmental clean.', 550, 'fixed', 'Half Day'),
  ('Asbestos Waste Collection 25 KG Bags', 'general', 'Full collection and disposal of asbestos 25KG bags. Price includes legal waste note certificate. 2 man collection.', 30, 'per_unit', ''),
  ('Asbestos Water Tank Removal', 'general', 'Safe removal and disposal of an old existing asbestos water tank (no bigger than 600 x 600). Includes legal waste note certificate. 2 man, approx 2 hour removal.', 650, 'fixed', ''),
  ('Corrugated Steel Roof Replacement', 'roofing', 'Full removal and disposal of single garage roof, replaced with 9mm boxed profile steel sheets in Merlin Grey. 10 year guarantee on material and labour.', 1850, 'fixed', '1'),
  ('Double Garage Roof Removal', 'general', 'Full removal and disposal of an existing asbestos double garage roof. Price includes legal waste certificate 1 day after completion and a full environmental clean.', 750, 'fixed', 'Half Day'),
  ('Full Roof Replacement', 'roofing', 'Complete removal and replacement of existing roof including felt, battens, and tiles. Includes waste disposal and a 10-year guarantee.', 8500, 'fixed', '5-7 days')
) as v(name, category, description, unit_price, unit_type, estimated_duration)
where not exists (select 1 from public.services s where s.name = v.name);
