import { z } from "zod";
import { baseSelectSchema } from "./common";

export const jobClientPhotoSchema = z.object({
  url: z.string().min(1),
  caption: z.string().default(''),
  uploaded_at: z.string().datetime().optional(),
});

export const jobMaterialSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(0),
  unit: z.string().optional(),
  unit_cost: z.number().min(0).optional(),
});

export const jobChecklistItemSchema = z.object({
  label: z.string().min(1),
  checked: z.boolean().default(false),
  notes: z.string().optional(),
});

export const jobInsertSchema = z.object({
  title: z.string().min(1),
  customer_id: z.string().uuid().nullable().optional(),
  customer_name: z.string().nullable().optional(),
  customer_email: z.string().email().nullable().optional(),
  quote_id: z.string().uuid().nullable().optional(),
  address: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  assigned_vehicle: z.string().nullable().optional(),
  assigned_team: z.string().nullable().optional(),
  assigned_contractor_id: z.string().uuid().nullable().optional(),
  client_photos: z.array(jobClientPhotoSchema).default([]),
  status: z.enum(['scheduled', 'on_hold', 'in_progress', 'invoiced', 'awaiting_payment', 'completed', 'cancelled']).default('scheduled'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  total_value: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
  color: z.string().default('#f97316'),
  reminder_24h_sent: z.boolean().default(false),
  completed_date: z.string().datetime().nullable().optional(),
  materials_used: z.array(jobMaterialSchema).default([]),
  checklist: z.array(jobChecklistItemSchema).default([]),
  check_in_time: z.string().datetime().nullable().optional(),
  check_out_time: z.string().datetime().nullable().optional(),
  check_in_lat: z.number().nullable().optional(),
  check_in_lng: z.number().nullable().optional(),
  arrival_confirmed: z.boolean().default(false),
  arrival_distance_m: z.number().int().nullable().optional(),
  arrival_note: z.string().nullable().optional(),
  site_lat: z.number().nullable().optional(),
  site_lng: z.number().nullable().optional(),
});

export const jobSelectSchema = baseSelectSchema.extend({
  ...jobInsertSchema.shape,
  message_token: z.string(),
});

export const jobUpdateSchema = jobInsertSchema.partial();

export type JobClientPhoto = z.infer<typeof jobClientPhotoSchema>;
export type JobMaterial = z.infer<typeof jobMaterialSchema>;
export type JobChecklistItem = z.infer<typeof jobChecklistItemSchema>;
export type JobInsert = z.infer<typeof jobInsertSchema>;
export type Job = z.infer<typeof jobSelectSchema>;
export type JobUpdate = z.infer<typeof jobUpdateSchema>;
