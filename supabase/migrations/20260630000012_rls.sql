-- Row-Level Security policies for all tables
-- Single-tenant CRM: all authenticated users share one workspace.
-- Role-based write restrictions are enforced here (not just UI-side).
-- Roles: admin > user > operative > sales > telesales > contractor

-- Helper: check if the calling user has a given role or higher
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_admin_or_sales()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales', 'telesales')
  );
$$;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

-- ─────────── users ───────────────────────────────────────────

CREATE POLICY "users: auth users can read all"
  ON public.users FOR SELECT TO authenticated USING (true);

CREATE POLICY "users: own row update"
  ON public.users FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "users: admin full access"
  ON public.users FOR ALL TO authenticated USING (is_admin());

-- ─────────── company_settings ────────────────────────────────

CREATE POLICY "company_settings: auth read"
  ON public.company_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "company_settings: admin write"
  ON public.company_settings FOR ALL TO authenticated USING (is_admin());

-- ─────────── customers ───────────────────────────────────────

CREATE POLICY "customers: auth read"
  ON public.customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "customers: auth insert"
  ON public.customers FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "customers: admin/sales update"
  ON public.customers FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'sales', 'telesales', 'user'));

CREATE POLICY "customers: admin delete"
  ON public.customers FOR DELETE TO authenticated USING (is_admin());

-- ─────────── leads ───────────────────────────────────────────

CREATE POLICY "leads: auth read"
  ON public.leads FOR SELECT TO authenticated USING (true);

CREATE POLICY "leads: auth insert"
  ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "leads: update own or admin/sales"
  ON public.leads FOR UPDATE TO authenticated
  USING (assigned_to_id = auth.uid() OR current_user_role() IN ('admin', 'sales', 'telesales'));

CREATE POLICY "leads: admin delete"
  ON public.leads FOR DELETE TO authenticated USING (is_admin());

-- ─────────── services ────────────────────────────────────────

CREATE POLICY "services: auth read"
  ON public.services FOR SELECT TO authenticated USING (true);

CREATE POLICY "services: admin write"
  ON public.services FOR ALL TO authenticated USING (is_admin());

-- ─────────── quotes ──────────────────────────────────────────

CREATE POLICY "quotes: auth read"
  ON public.quotes FOR SELECT TO authenticated USING (true);

CREATE POLICY "quotes: auth insert"
  ON public.quotes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "quotes: auth update"
  ON public.quotes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "quotes: admin delete"
  ON public.quotes FOR DELETE TO authenticated USING (is_admin());

-- ─────────── invoices ────────────────────────────────────────

CREATE POLICY "invoices: auth read"
  ON public.invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "invoices: auth insert"
  ON public.invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "invoices: auth update"
  ON public.invoices FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "invoices: admin delete"
  ON public.invoices FOR DELETE TO authenticated USING (is_admin());

-- ─────────── jobs ────────────────────────────────────────────

CREATE POLICY "jobs: auth read"
  ON public.jobs FOR SELECT TO authenticated USING (true);

CREATE POLICY "jobs: admin/manager insert"
  ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'user'));

CREATE POLICY "jobs: admin/operative update"
  ON public.jobs FOR UPDATE TO authenticated
  USING (
    current_user_role() IN ('admin', 'user')
    OR assigned_contractor_id = auth.uid()
  );

CREATE POLICY "jobs: admin delete"
  ON public.jobs FOR DELETE TO authenticated USING (is_admin());

-- ─────────── job_completions ─────────────────────────────────

CREATE POLICY "job_completions: auth read"
  ON public.job_completions FOR SELECT TO authenticated USING (true);

CREATE POLICY "job_completions: auth insert"
  ON public.job_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "job_completions: auth update"
  ON public.job_completions FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- ─────────── job_arrivals ────────────────────────────────────

CREATE POLICY "job_arrivals: auth read"
  ON public.job_arrivals FOR SELECT TO authenticated USING (true);

CREATE POLICY "job_arrivals: auth insert"
  ON public.job_arrivals FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ─────────── job_chats ───────────────────────────────────────

CREATE POLICY "job_chats: auth read"
  ON public.job_chats FOR SELECT TO authenticated USING (true);

CREATE POLICY "job_chats: auth insert"
  ON public.job_chats FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ─────────── job_messages ────────────────────────────────────

CREATE POLICY "job_messages: auth read"
  ON public.job_messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "job_messages: auth insert"
  ON public.job_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ─────────── reschedule_requests ─────────────────────────────

CREATE POLICY "reschedule_requests: auth read"
  ON public.reschedule_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "reschedule_requests: auth insert"
  ON public.reschedule_requests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "reschedule_requests: admin update"
  ON public.reschedule_requests FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'user'));

-- ─────────── extra_work_requests ─────────────────────────────

CREATE POLICY "extra_work_requests: auth read"
  ON public.extra_work_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "extra_work_requests: contractor insert"
  ON public.extra_work_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "extra_work_requests: admin decide"
  ON public.extra_work_requests FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'user'));

-- ─────────── receipts ────────────────────────────────────────

CREATE POLICY "receipts: auth read"
  ON public.receipts FOR SELECT TO authenticated USING (true);

CREATE POLICY "receipts: auth insert"
  ON public.receipts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "receipts: admin decide"
  ON public.receipts FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'user'));

-- ─────────── vehicles ────────────────────────────────────────

CREATE POLICY "vehicles: auth read"
  ON public.vehicles FOR SELECT TO authenticated USING (true);

CREATE POLICY "vehicles: admin write"
  ON public.vehicles FOR ALL TO authenticated USING (is_admin());

-- ─────────── attendance ──────────────────────────────────────

CREATE POLICY "attendance: auth read"
  ON public.attendance FOR SELECT TO authenticated USING (true);

CREATE POLICY "attendance: auth insert"
  ON public.attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "attendance: admin update"
  ON public.attendance FOR UPDATE TO authenticated USING (is_admin());

-- ─────────── contractors ─────────────────────────────────────

CREATE POLICY "contractors: auth read"
  ON public.contractors FOR SELECT TO authenticated USING (true);

CREATE POLICY "contractors: admin insert"
  ON public.contractors FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'user'));

CREATE POLICY "contractors: own or admin update"
  ON public.contractors FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "contractors: admin delete"
  ON public.contractors FOR DELETE TO authenticated USING (is_admin());

-- ─────────── subcontractors ──────────────────────────────────

CREATE POLICY "subcontractors: auth read"
  ON public.subcontractors FOR SELECT TO authenticated USING (true);

CREATE POLICY "subcontractors: admin write"
  ON public.subcontractors FOR ALL TO authenticated USING (is_admin());

-- ─────────── job_bids ────────────────────────────────────────

CREATE POLICY "job_bids: auth read"
  ON public.job_bids FOR SELECT TO authenticated USING (true);

CREATE POLICY "job_bids: subcontractor insert"
  ON public.job_bids FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "job_bids: admin decide"
  ON public.job_bids FOR UPDATE TO authenticated USING (is_admin());

-- ─────────── internal_chats ──────────────────────────────────

CREATE POLICY "internal_chats: auth read"
  ON public.internal_chats FOR SELECT TO authenticated USING (true);

CREATE POLICY "internal_chats: auth insert"
  ON public.internal_chats FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- ─────────── messages ────────────────────────────────────────

CREATE POLICY "messages: auth read"
  ON public.messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "messages: auth insert"
  ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "messages: auth update"
  ON public.messages FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- ─────────── staff_messages ──────────────────────────────────

CREATE POLICY "staff_messages: auth read"
  ON public.staff_messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "staff_messages: auth insert"
  ON public.staff_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ─────────── email_sequences ─────────────────────────────────

CREATE POLICY "email_sequences: auth read"
  ON public.email_sequences FOR SELECT TO authenticated USING (true);

CREATE POLICY "email_sequences: admin write"
  ON public.email_sequences FOR ALL TO authenticated USING (is_admin());

-- ─────────── sequence_email_logs ─────────────────────────────

CREATE POLICY "sequence_email_logs: auth read"
  ON public.sequence_email_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "sequence_email_logs: system insert"
  ON public.sequence_email_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "sequence_email_logs: system update"
  ON public.sequence_email_logs FOR UPDATE TO authenticated USING (true);

-- ─────────── alerts ──────────────────────────────────────────

CREATE POLICY "alerts: auth read"
  ON public.alerts FOR SELECT TO authenticated USING (true);

CREATE POLICY "alerts: system insert"
  ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "alerts: auth update"
  ON public.alerts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- ─────────── audit_logs ──────────────────────────────────────

CREATE POLICY "audit_logs: admin read"
  ON public.audit_logs FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "audit_logs: system insert"
  ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ─────────── bonus/commission/prize settings ─────────────────

CREATE POLICY "bonus_settings: auth read"
  ON public.bonus_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "bonus_settings: admin write"
  ON public.bonus_settings FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "commission_settings: auth read"
  ON public.commission_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "commission_settings: admin write"
  ON public.commission_settings FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "operative_bonuses: auth read"
  ON public.operative_bonuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "operative_bonuses: admin write"
  ON public.operative_bonuses FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "prize_settings: auth read"
  ON public.prize_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "prize_settings: admin write"
  ON public.prize_settings FOR ALL TO authenticated USING (is_admin());

-- ─────────── feedbacks ───────────────────────────────────────

CREATE POLICY "feedbacks: auth read"
  ON public.feedbacks FOR SELECT TO authenticated USING (true);
CREATE POLICY "feedbacks: public insert"
  ON public.feedbacks FOR INSERT WITH CHECK (true);

-- ─────────── integration_connections ─────────────────────────

CREATE POLICY "integration_connections: auth read"
  ON public.integration_connections FOR SELECT TO authenticated USING (true);
CREATE POLICY "integration_connections: admin write"
  ON public.integration_connections FOR ALL TO authenticated USING (is_admin());

-- ─────────── invited_users ───────────────────────────────────

CREATE POLICY "invited_users: admin read"
  ON public.invited_users FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "invited_users: admin write"
  ON public.invited_users FOR ALL TO authenticated USING (is_admin());

-- ─────────── signup_requests ─────────────────────────────────

CREATE POLICY "signup_requests: public insert"
  ON public.signup_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "signup_requests: admin read/manage"
  ON public.signup_requests FOR ALL TO authenticated USING (is_admin());

-- ─────────── website_domains ─────────────────────────────────

CREATE POLICY "website_domains: auth read"
  ON public.website_domains FOR SELECT TO authenticated USING (true);
CREATE POLICY "website_domains: admin write"
  ON public.website_domains FOR ALL TO authenticated USING (is_admin());
