-- Batch A (§1) — default email-sequence content so the runners actually send.
-- Idempotent via WHERE NOT EXISTS (no reliance on a UNIQUE constraint, which the
-- table may not have in every environment).
-- Bodies are HTML fragments (the send wraps them in the branded template).
-- Placeholders: {{customer_name}} {{lead_name}} {{quote_number}} {{total}}
--               {{invoice_number}} {{due_date}} {{service_interest}}

INSERT INTO public.email_sequences (sequence_type, step, delay_days, subject, body, label)
SELECT v.sequence_type, v.step, v.delay_days, v.subject, v.body, v.label
FROM (VALUES
  ('new_lead'::email_sequence_type, 1, 0, 'Thanks for getting in touch',
   '<p>Hi {{customer_name}},</p><p>Thanks for your enquiry about {{service_interest}}. One of our team will be in touch shortly. In the meantime, reply to this email with any details and we''ll get you a fast, no-obligation quote.</p>',
   'Welcome'),
  ('new_lead', 2, 3, 'Still need a hand?',
   '<p>Hi {{customer_name}},</p><p>Just following up on your enquiry — we''d love to help. Reply here or give us a call and we''ll sort a quote for you right away.</p>',
   'Day 3 follow-up'),
  ('quote_not_booked', 1, 2, 'Your quote {{quote_number}} — any questions?',
   '<p>Hi {{customer_name}},</p><p>We sent you quote <strong>{{quote_number}}</strong> for <strong>{{total}}</strong>. Just checking whether you had any questions — we''re happy to help you get booked in.</p>',
   'Day 2 nudge'),
  ('quote_not_booked', 2, 5, 'Ready to book {{quote_number}}?',
   '<p>Hi {{customer_name}},</p><p>Your quote <strong>{{quote_number}}</strong> ({{total}}) is still available. Tap below to view it and choose a date that suits you.</p>',
   'Day 5 nudge'),
  ('invoice_not_paid', 1, 3, 'Invoice {{invoice_number}} — friendly reminder',
   '<p>Hi {{customer_name}},</p><p>A quick reminder that invoice <strong>{{invoice_number}}</strong> for <strong>{{total}}</strong> is awaiting payment (due {{due_date}}). If you''ve already paid, please ignore this.</p>',
   'Day 3 reminder'),
  ('invoice_not_paid', 2, 7, 'Invoice {{invoice_number}} now overdue',
   '<p>Hi {{customer_name}},</p><p>Invoice <strong>{{invoice_number}}</strong> for <strong>{{total}}</strong> was due on {{due_date}} and is now overdue. Please arrange payment at your earliest convenience, or reply if there''s a problem.</p>',
   'Day 7 overdue')
) AS v(sequence_type, step, delay_days, subject, body, label)
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_sequences e
  WHERE e.sequence_type = v.sequence_type AND e.step = v.step
);
