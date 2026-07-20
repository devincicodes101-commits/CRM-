-- Tighten commission_invoices read access. The gap-fill policy let ANY
-- authenticated user (incl. contractors/operatives) read every agent's
-- commission figures. Restrict to admins/managers, or the agent's own rows.

DROP POLICY IF EXISTS "commission_invoices_read" ON public.commission_invoices;

CREATE POLICY "commission_invoices_read" ON public.commission_invoices
  FOR SELECT USING (
    sales_agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'user')
    )
  );
