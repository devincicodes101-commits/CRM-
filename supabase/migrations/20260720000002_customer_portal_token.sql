-- Unguessable per-customer token for the no-login Customer Portal (/portal/[token]).
-- Same pattern as quotes.public_token / jobs.message_token.

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS portal_token text;

UPDATE public.customers
  SET portal_token = encode(gen_random_bytes(16), 'hex')
  WHERE portal_token IS NULL;

ALTER TABLE public.customers
  ALTER COLUMN portal_token SET DEFAULT encode(gen_random_bytes(16), 'hex');
ALTER TABLE public.customers
  ALTER COLUMN portal_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customers_portal_token_key
  ON public.customers (portal_token);
