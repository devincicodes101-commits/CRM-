-- Track when a chasing reminder was last sent, so the overdue-invoice and
-- commission-invoice cron jobs are idempotent (remind every few days, not daily).

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS last_reminder_sent timestamptz;

ALTER TABLE public.commission_invoices
  ADD COLUMN IF NOT EXISTS last_reminder_sent timestamptz;
