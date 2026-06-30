import { z } from "zod";
import { baseSelectSchema } from "./common";

// ─── Job Completion ───────────────────────────────────────────────────────────

export const jobCompletionInsertSchema = z.object({
  job_id: z.string().uuid(),
  job_title: z.string().nullable().optional(),
  customer_name: z.string().min(1),
  customer_email: z.string().email().nullable().optional(),
  customer_signature: z.string().nullable().optional(),
  customer_satisfaction: z.enum(['excellent', 'good', 'satisfactory', 'poor']).nullable().optional(),
  customer_comments: z.string().nullable().optional(),
  star_rating: z.number().int().min(1).max(5).nullable().optional(),
  feedback: z.string().nullable().optional(),
  operative_name: z.string().nullable().optional(),
  completed_date: z.string().datetime().nullable().optional(),
  invoice_id: z.string().uuid().nullable().optional(),
  invoice_number: z.string().nullable().optional(),
  photos: z.array(z.string()).default([]),
  video_url: z.string().nullable().optional(),
  customer_signed_off: z.boolean().default(false),
  thank_you_email_sent: z.boolean().default(false),
});

export const jobCompletionSelectSchema = baseSelectSchema.extend(jobCompletionInsertSchema.shape);
export const jobCompletionUpdateSchema = jobCompletionInsertSchema.partial();
export type JobCompletionInsert = z.infer<typeof jobCompletionInsertSchema>;
export type JobCompletion = z.infer<typeof jobCompletionSelectSchema>;

// ─── Job Arrival ──────────────────────────────────────────────────────────────

export const jobArrivalInsertSchema = z.object({
  job_id: z.string().uuid(),
  vehicle_id: z.string().uuid().nullable().optional(),
  arrival_lat: z.number(),
  arrival_lng: z.number(),
  arrival_time: z.string().datetime(),
  invoice_sent: z.boolean().default(false),
});

export const jobArrivalSelectSchema = baseSelectSchema.extend(jobArrivalInsertSchema.shape);
export const jobArrivalUpdateSchema = jobArrivalInsertSchema.partial();
export type JobArrivalInsert = z.infer<typeof jobArrivalInsertSchema>;
export type JobArrival = z.infer<typeof jobArrivalSelectSchema>;

// ─── Job Chat ─────────────────────────────────────────────────────────────────

export const jobChatInsertSchema = z.object({
  job_id: z.string().uuid(),
  job_title: z.string().nullable().optional(),
  job_date: z.string().datetime().nullable().optional(),
  sender_name: z.string().min(1),
  sender_role: z.enum(['admin', 'operative', 'customer']).nullable().optional(),
  message: z.string().min(1),
  is_read: z.boolean().default(false),
});

export const jobChatSelectSchema = baseSelectSchema.extend(jobChatInsertSchema.shape);
export const jobChatUpdateSchema = jobChatInsertSchema.partial();
export type JobChatInsert = z.infer<typeof jobChatInsertSchema>;
export type JobChat = z.infer<typeof jobChatSelectSchema>;

// ─── Job Message ──────────────────────────────────────────────────────────────

export const jobMessageInsertSchema = z.object({
  job_id: z.string().uuid(),
  job_title: z.string().nullable().optional(),
  sender_role: z.enum(['office', 'contractor', 'client']),
  sender_name: z.string().nullable().optional(),
  body: z.string().min(1),
  assigned_contractor_user_id: z.string().uuid().nullable().optional(),
});

export const jobMessageSelectSchema = baseSelectSchema.extend(jobMessageInsertSchema.shape);
export const jobMessageUpdateSchema = jobMessageInsertSchema.partial();
export type JobMessageInsert = z.infer<typeof jobMessageInsertSchema>;
export type JobMessage = z.infer<typeof jobMessageSelectSchema>;

// ─── Reschedule Request ───────────────────────────────────────────────────────

export const rescheduleRequestInsertSchema = z.object({
  job_id: z.string().uuid(),
  customer_email: z.string().email(),
  customer_name: z.string().min(1),
  job_title: z.string().nullable().optional(),
  original_date: z.string().datetime().nullable().optional(),
  requested_date: z.string().datetime().nullable().optional(),
  reason: z.string().nullable().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  notes: z.string().nullable().optional(),
  request_date: z.string().datetime().optional(),
});

export const rescheduleRequestSelectSchema = baseSelectSchema.extend(rescheduleRequestInsertSchema.shape);
export const rescheduleRequestUpdateSchema = rescheduleRequestInsertSchema.partial();
export type RescheduleRequestInsert = z.infer<typeof rescheduleRequestInsertSchema>;
export type RescheduleRequest = z.infer<typeof rescheduleRequestSelectSchema>;

// ─── Extra Work Request ───────────────────────────────────────────────────────

export const extraWorkRequestInsertSchema = z.object({
  job_id: z.string().uuid(),
  job_title: z.string().nullable().optional(),
  contractor_id: z.string().uuid(),
  contractor_user_id: z.string().uuid().nullable().optional(),
  contractor_name: z.string().nullable().optional(),
  description: z.string().min(1),
  amount: z.number().min(0),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  decided_at: z.string().datetime().nullable().optional(),
  decided_by: z.string().uuid().nullable().optional(),
});

export const extraWorkRequestSelectSchema = baseSelectSchema.extend(extraWorkRequestInsertSchema.shape);
export const extraWorkRequestUpdateSchema = extraWorkRequestInsertSchema.partial();
export type ExtraWorkRequestInsert = z.infer<typeof extraWorkRequestInsertSchema>;
export type ExtraWorkRequest = z.infer<typeof extraWorkRequestSelectSchema>;

// ─── Receipt ──────────────────────────────────────────────────────────────────

export const receiptInsertSchema = z.object({
  job_id: z.string().uuid(),
  operative_name: z.string().min(1),
  photo_url: z.string().min(1),
  amount_gbp: z.number().min(0).nullable().optional(),
  item_description: z.string().nullable().optional(),
  purchase_date: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});

export const receiptSelectSchema = baseSelectSchema.extend(receiptInsertSchema.shape);
export const receiptUpdateSchema = receiptInsertSchema.partial();
export type ReceiptInsert = z.infer<typeof receiptInsertSchema>;
export type Receipt = z.infer<typeof receiptSelectSchema>;
