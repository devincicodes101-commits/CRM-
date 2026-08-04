-- Batch 2 (Base44 port §2–§7): three-way assignment, contractor bid invites, live auction.
--
-- Schema notes:
--  * jobs.assigned_contractor_id historically referenced auth.users, but the app
--    stores the contractors.id there (job-form binds it to a contractor row). We
--    re-point the FK to contractors(id) so the data model is consistent, and add
--    assigned_contractor_user_id for the contractor's LOGIN user (RLS + field app
--    + §7 change detection). This also fixes a latent bug: the field extra-work
--    action already SELECTs assigned_contractor_user_id from jobs.
--  * auction_status enum already exists as ('open','closed','won','cancelled').
--    We keep it and map Base44's states: live -> 'open', resolved-with-winner ->
--    'won', no-bids -> 'cancelled'. (See src/lib/auction.ts constants.)

-- ─── Jobs: contractor assignment + acceptance ────────────────────────────────

-- Re-point assigned_contractor_id from auth.users -> contractors.
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_assigned_contractor_id_fkey;
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_assigned_contractor_id_fkey
  FOREIGN KEY (assigned_contractor_id) REFERENCES public.contractors(id) ON DELETE SET NULL;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS assigned_contractor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contractor_acceptance text
    CHECK (contractor_acceptance IN ('pending', 'accepted', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_jobs_contractor_user ON public.jobs(assigned_contractor_user_id);

-- The field app / contractor "my jobs" access keys off the login user, not the
-- contractor row id. Repoint the update policy accordingly.
DROP POLICY IF EXISTS "jobs: admin/operative update" ON public.jobs;
CREATE POLICY "jobs: admin/operative update"
  ON public.jobs FOR UPDATE TO authenticated
  USING (
    current_user_role() IN ('admin', 'user')
    OR assigned_contractor_user_id = auth.uid()
  );

-- ─── contractor_bids: invites + auction bids ─────────────────────────────────
-- Distinct from the subcontractor-marketplace job_bids table. One row per
-- (job, contractor): the invite, the contractor's response, and — for auctions —
-- their standing bid.

CREATE TABLE IF NOT EXISTS public.contractor_bids (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id              uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id       uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  contractor_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contractor_name     text,
  contractor_email    text,
  status              text NOT NULL DEFAULT 'invited'
                        CHECK (status IN ('invited', 'interested', 'declined')),
  note                text,
  proposed_price      numeric(10,2),
  proposed_dates      text,
  -- Auction fields (§3)
  bid_amount          numeric(10,2),
  is_auction_bid      boolean NOT NULL DEFAULT false,
  bid_time            timestamptz,
  invited_date        timestamptz NOT NULL DEFAULT now(),
  responded_date      timestamptz,
  created_by_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_date        timestamptz NOT NULL DEFAULT now(),
  updated_date        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, contractor_id)
);

CREATE INDEX IF NOT EXISTS idx_contractor_bids_job ON public.contractor_bids(job_id);
CREATE INDEX IF NOT EXISTS idx_contractor_bids_contractor ON public.contractor_bids(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_bids_user ON public.contractor_bids(contractor_user_id);
SELECT attach_updated_date_trigger('contractor_bids');
ALTER TABLE public.contractor_bids ENABLE ROW LEVEL SECURITY;

-- Staff (admin/user) full access; contractor sees + updates only their own row.
CREATE POLICY "contractor_bids: staff read"
  ON public.contractor_bids FOR SELECT TO authenticated
  USING (current_user_role() IN ('admin', 'user') OR contractor_user_id = auth.uid());

CREATE POLICY "contractor_bids: staff insert"
  ON public.contractor_bids FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'user') OR contractor_user_id = auth.uid());

CREATE POLICY "contractor_bids: update own or staff"
  ON public.contractor_bids FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'user') OR contractor_user_id = auth.uid());

CREATE POLICY "contractor_bids: admin delete"
  ON public.contractor_bids FOR DELETE TO authenticated USING (is_admin());
