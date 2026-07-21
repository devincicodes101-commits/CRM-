import { z } from "zod";
import { baseSelectSchema, isoDateTimeOptional } from "./common";

export const leadInsertSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  source: z.enum(['facebook', 'instagram', 'tiktok', 'twitter', 'linkedin', 'website_form', 'google_ads', 'referral', 'other']).nullable().optional(),
  category: z.enum(['web_forms', 'social', 'ppc', 'other']).nullable().optional(),
  service_interest: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'appointment_booked', 'quoted', 'negotiation', 'won', 'lost']).default('new'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  assigned_to: z.string().nullable().optional(),
  assigned_to_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  call_notes: z.string().nullable().optional(),
  follow_up_date: isoDateTimeOptional,
  follow_up_time: z.string().nullable().optional(),
  estimated_value: z.number().min(0).nullable().optional(),
  converted_to_customer_id: z.string().uuid().nullable().optional(),
  converted_to_quote_id: z.string().uuid().nullable().optional(),
  seq_steps_sent: z.array(z.number().int()).default([]),
  consent_given: z.boolean().default(false),
  consent_date: z.string().datetime().nullable().optional(),
});

export const leadSelectSchema = baseSelectSchema.extend(leadInsertSchema.shape);
export const leadUpdateSchema = leadInsertSchema.partial();

export type LeadInsert = z.infer<typeof leadInsertSchema>;
export type Lead = z.infer<typeof leadSelectSchema>;
export type LeadUpdate = z.infer<typeof leadUpdateSchema>;
