-- Quotes and Invoices

CREATE TABLE IF NOT EXISTS public.quotes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number          text NOT NULL UNIQUE DEFAULT next_quote_number(),
  client_type           quote_client_type NOT NULL DEFAULT 'residential',
  customer_id           uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name         text NOT NULL,
  customer_email        text,
  customer_address      text,
  sales_agent_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sales_agent_name      text,
  items                 jsonb NOT NULL DEFAULT '[]',
  -- items shape: [{service_id, service_name, description, quantity, unit_price, unit_type, total, video_url}]
  subtotal              numeric(10,2) NOT NULL DEFAULT 0,
  discount_type         discount_type NOT NULL DEFAULT 'none',
  discount_value        numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount       numeric(10,2) NOT NULL DEFAULT 0,
  vat_rate              numeric(5,2) NOT NULL DEFAULT 20,
  vat_amount            numeric(10,2) NOT NULL DEFAULT 0,
  total                 numeric(10,2) NOT NULL DEFAULT 0,
  notes                 text,
  status                quote_status NOT NULL DEFAULT 'draft',
  valid_until           timestamptz,
  template_style        quote_template NOT NULL DEFAULT 'modern',
  sent_date             timestamptz,
  discount_email_sent   boolean NOT NULL DEFAULT false,
  followup_day7_sent    boolean NOT NULL DEFAULT false,
  followup_day14_sent   boolean NOT NULL DEFAULT false,
  reminder_date         timestamptz,
  reminder_time         text,
  reminder_note         text,
  reminder_done         boolean NOT NULL DEFAULT false,
  images                text[] NOT NULL DEFAULT '{}',
  created_by_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date          timestamptz NOT NULL DEFAULT now(),
  updated_date          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_customer ON public.quotes(customer_id);
SELECT attach_updated_date_trigger('quotes');
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- FK from leads to quotes (deferred to avoid circular dep)
ALTER TABLE public.leads ADD CONSTRAINT fk_leads_quote
  FOREIGN KEY (converted_to_quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invoices (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number   text NOT NULL UNIQUE DEFAULT next_invoice_number(),
  quote_id         uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  customer_id      uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name    text NOT NULL,
  customer_email   text,
  customer_address text,
  invoice_type     invoice_type NOT NULL DEFAULT 'standard',
  billed_amount    numeric(10,2),
  items            jsonb NOT NULL DEFAULT '[]',
  -- items shape: [{service_name, description, quantity, unit_price, total}]
  subtotal         numeric(10,2) NOT NULL DEFAULT 0,
  discount_type    discount_type NOT NULL DEFAULT 'none',
  discount_value   numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount  numeric(10,2) NOT NULL DEFAULT 0,
  vat_rate         numeric(5,2) NOT NULL DEFAULT 20,
  vat_amount       numeric(10,2) NOT NULL DEFAULT 0,
  total            numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid      numeric(10,2) NOT NULL DEFAULT 0,
  notes            text,
  status           invoice_status NOT NULL DEFAULT 'draft',
  due_date         timestamptz,
  sent_date        timestamptz,
  paid_date        timestamptz,
  payment_method   payment_method,
  attachments      jsonb NOT NULL DEFAULT '[]',
  -- attachments shape: [{url, name, uploaded_date}]
  created_by_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date     timestamptz NOT NULL DEFAULT now(),
  updated_date     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);
SELECT attach_updated_date_trigger('invoices');
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
