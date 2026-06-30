-- Utility functions and triggers shared across all tables

-- Auto-update updated_date on every row update
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$;

-- Create a user profile row when someone signs up via Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-generate quote numbers: QU-00001
CREATE SEQUENCE IF NOT EXISTS quote_number_seq START 1;
CREATE OR REPLACE FUNCTION next_quote_number()
RETURNS text LANGUAGE sql AS $$
  SELECT 'QU-' || LPAD(nextval('quote_number_seq')::text, 5, '0');
$$;

-- Auto-generate invoice numbers: INV-00001
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS text LANGUAGE sql AS $$
  SELECT 'INV-' || LPAD(nextval('invoice_number_seq')::text, 5, '0');
$$;

-- Helper macro: attach updated_date trigger to a table
-- Usage: SELECT attach_updated_date_trigger('table_name');
CREATE OR REPLACE FUNCTION attach_updated_date_trigger(tbl text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format(
    'CREATE OR REPLACE TRIGGER set_updated_date
     BEFORE UPDATE ON %I
     FOR EACH ROW EXECUTE FUNCTION update_updated_date()',
    tbl
  );
END;
$$;
