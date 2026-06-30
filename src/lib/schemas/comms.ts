import { z } from "zod";
import { baseSelectSchema } from "./common";

// ─── Internal Chat ────────────────────────────────────────────────────────────

export const internalChatInsertSchema = z.object({
  channel: z.string().min(1),
  sender_id: z.string().uuid(),
  sender_name: z.string().min(1),
  sender_role: z.string().nullable().optional(),
  sender_avatar: z.string().nullable().optional(),
  message: z.string().min(1),
  is_read_by: z.array(z.string()).default([]),
});

export const internalChatSelectSchema = baseSelectSchema.extend(internalChatInsertSchema.shape);
export const internalChatUpdateSchema = internalChatInsertSchema.partial();
export type InternalChatInsert = z.infer<typeof internalChatInsertSchema>;
export type InternalChat = z.infer<typeof internalChatSelectSchema>;

// ─── Message ──────────────────────────────────────────────────────────────────

export const messageInsertSchema = z.object({
  job_id: z.string().uuid().nullable().optional(),
  quote_id: z.string().uuid().nullable().optional(),
  customer_email: z.string().email(),
  customer_name: z.string().min(1),
  subject: z.string().nullable().optional(),
  content: z.string().min(1),
  sender_type: z.enum(['customer', 'admin']),
  is_read: z.boolean().default(false),
  status: z.enum(['open', 'answered']).default('open'),
  conversation_id: z.string().uuid().nullable().optional(),
});

export const messageSelectSchema = baseSelectSchema.extend(messageInsertSchema.shape);
export const messageUpdateSchema = messageInsertSchema.partial();
export type MessageInsert = z.infer<typeof messageInsertSchema>;
export type Message = z.infer<typeof messageSelectSchema>;

// ─── Staff Message ────────────────────────────────────────────────────────────

export const staffMessageInsertSchema = z.object({
  from_email: z.string().email(),
  from_name: z.string().nullable().optional(),
  to_email: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  is_read: z.boolean().default(false),
  thread_id: z.string().uuid().nullable().optional(),
});

export const staffMessageSelectSchema = baseSelectSchema.extend(staffMessageInsertSchema.shape);
export const staffMessageUpdateSchema = staffMessageInsertSchema.partial();
export type StaffMessageInsert = z.infer<typeof staffMessageInsertSchema>;
export type StaffMessage = z.infer<typeof staffMessageSelectSchema>;

// ─── Email Sequence ───────────────────────────────────────────────────────────

export const emailSequenceInsertSchema = z.object({
  sequence_type: z.enum(['new_lead', 'quote_not_booked', 'invoice_not_paid']),
  step: z.number().int().min(1),
  delay_days: z.number().int().min(0),
  subject: z.string().min(1),
  body: z.string().min(1),
  is_active: z.boolean().default(true),
  label: z.string().nullable().optional(),
});

export const emailSequenceSelectSchema = baseSelectSchema.extend(emailSequenceInsertSchema.shape);
export const emailSequenceUpdateSchema = emailSequenceInsertSchema.partial();
export type EmailSequenceInsert = z.infer<typeof emailSequenceInsertSchema>;
export type EmailSequence = z.infer<typeof emailSequenceSelectSchema>;

// ─── Sequence Email Log ───────────────────────────────────────────────────────

export const sequenceEmailLogInsertSchema = z.object({
  sequence_type: z.enum(['new_lead', 'quote_not_booked', 'invoice_not_paid']),
  step_number: z.number().int().min(1),
  step_label: z.string().nullable().optional(),
  recipient_email: z.string().email(),
  recipient_name: z.string().nullable().optional(),
  related_id: z.string().uuid().nullable().optional(),
  related_type: z.enum(['lead', 'quote', 'invoice']).nullable().optional(),
  subject: z.string().nullable().optional(),
  sent_date: z.string().datetime(),
  resend_message_id: z.string().nullable().optional(),
  opened: z.boolean().default(false),
  opened_date: z.string().datetime().nullable().optional(),
  clicked: z.boolean().default(false),
  clicked_date: z.string().datetime().nullable().optional(),
  replied: z.boolean().default(false),
  replied_date: z.string().datetime().nullable().optional(),
});

export const sequenceEmailLogSelectSchema = baseSelectSchema.extend(sequenceEmailLogInsertSchema.shape);
export const sequenceEmailLogUpdateSchema = sequenceEmailLogInsertSchema.partial();
export type SequenceEmailLogInsert = z.infer<typeof sequenceEmailLogInsertSchema>;
export type SequenceEmailLog = z.infer<typeof sequenceEmailLogSelectSchema>;
