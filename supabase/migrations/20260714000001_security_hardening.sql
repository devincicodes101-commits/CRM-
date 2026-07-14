-- Security hardening — foundation pass before feature-parity port.
-- Fixes: privilege escalation via users.role, sequential public quote token (IDOR),
-- unpinned SECURITY DEFINER search_path, over-permissive write policies.
-- Idempotent where practical so it can be re-applied safely.

-- ─────────────────────────────────────────────────────────────
-- 1. Pin search_path on SECURITY DEFINER helpers (prevents
--    search_path-injection privilege escalation).
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_admin_or_sales()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales', 'telesales')
  );
$$;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Block non-admins from changing their own role / permissions.
--    The "users: own row update" RLS policy is kept (so users can
--    edit their profile), but this trigger stops privilege escalation
--    on the role / nav_permissions columns specifically.
--    Legit admin updates (authenticated, is_admin) and service-role
--    automations are allowed through.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION prevent_self_role_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  claims_role text := COALESCE(
    (current_setting('request.jwt.claims', true)::json ->> 'role'), ''
  );
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role
      OR NEW.nav_permissions IS DISTINCT FROM OLD.nav_permissions)
     AND claims_role <> 'service_role'
     AND NOT is_admin()
  THEN
    RAISE EXCEPTION 'Only admins can change role or permissions';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_block_self_role_change ON public.users;
CREATE TRIGGER users_block_self_role_change
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION prevent_self_role_escalation();

-- ─────────────────────────────────────────────────────────────
-- 3. Unguessable public token for quotes (was using the sequential
--    quote_number — trivially enumerable). Jobs/completion/feedback
--    already use jobs.message_token (random), so they're unaffected.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS public_token text;

-- Backfill existing rows, then enforce NOT NULL + UNIQUE + default.
UPDATE public.quotes
  SET public_token = encode(gen_random_bytes(16), 'hex')
  WHERE public_token IS NULL;

ALTER TABLE public.quotes
  ALTER COLUMN public_token SET DEFAULT encode(gen_random_bytes(16), 'hex');
ALTER TABLE public.quotes
  ALTER COLUMN public_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS quotes_public_token_key
  ON public.quotes (public_token);

-- ─────────────────────────────────────────────────────────────
-- 4. Tighten over-permissive write policies. Money- and message-
--    bearing tables were writable by ANY authenticated user
--    (including external contractors/operatives). Restrict writes
--    to staff roles. Public accept/decline now goes through a
--    token-guarded service-role action, not anon RLS.
-- ─────────────────────────────────────────────────────────────

-- quotes: staff-only update (public flow uses service role + token)
DROP POLICY IF EXISTS "quotes: auth update" ON public.quotes;
CREATE POLICY "quotes: staff update"
  ON public.quotes FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'user', 'sales', 'telesales'));

-- invoices: staff-only update (no contractor/operative payment tampering)
DROP POLICY IF EXISTS "invoices: auth update" ON public.invoices;
CREATE POLICY "invoices: staff update"
  ON public.invoices FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'user', 'sales', 'telesales'));

-- messages: staff-only update (mark read/answered)
DROP POLICY IF EXISTS "messages: auth update" ON public.messages;
CREATE POLICY "messages: staff update"
  ON public.messages FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'user', 'sales', 'telesales'));

-- audit_logs: no client-side inserts (were forgeable via anon key).
-- Audit entries are written server-side with the service-role client,
-- which bypasses RLS — so we simply remove the permissive INSERT policy.
DROP POLICY IF EXISTS "audit_logs: system insert" ON public.audit_logs;

-- ─────────────────────────────────────────────────────────────
-- 5. Clamp self-assigned role at signup. The trigger previously
--    trusted raw_user_meta_data->>'role' verbatim, so anyone could
--    register as 'admin'. Only 'user' and 'contractor' are allowed
--    from self-signup; staff roles must be granted by an admin.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requested text := NEW.raw_user_meta_data ->> 'role';
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    CASE
      WHEN requested IN ('user', 'contractor') THEN requested::user_role
      ELSE 'user'::user_role
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- TODO (follow-up, not in this pass — needs job-assignment scoping
-- finalized so field flows don't break):
--   * Scope contractor/operative SELECT on customers, leads, quotes,
--     invoices, commission_settings, bonus_settings, operative_bonuses
--     to only their own job-related rows instead of USING (true).
-- ─────────────────────────────────────────────────────────────
