-- Align invoice_mode with the Base44 spec: default is white-label (contractor-
-- branded customer invoice + agency commission invoice), not company-direct.
-- Only changes the column default + any rows still on the old implicit default;
-- an explicit company_direct choice made in settings is preserved.

ALTER TABLE public.company_settings
  ALTER COLUMN invoice_mode SET DEFAULT 'white_label';
