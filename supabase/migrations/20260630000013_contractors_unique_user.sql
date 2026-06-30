-- Phase 2: onboarding upserts contractors by user_id, needs a unique constraint
-- to target with ON CONFLICT. NULLs (admin-created contractor rows with no
-- linked auth user) remain unrestricted since Postgres treats NULL <> NULL.

ALTER TABLE public.contractors
  ADD CONSTRAINT contractors_user_id_key UNIQUE (user_id);
