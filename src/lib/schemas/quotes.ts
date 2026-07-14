import { z } from "zod";
import { baseSelectSchema } from "./common";

export const quoteItemSchema = z.object({
  service_id: z.string().uuid().optional(),
  service_name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().min(0),
  unit_price: z.number().min(0),
  unit_type: z.string().optional(),
  total: z.number().min(0),
  video_url: z.string().optional(),
});

export const quoteInsertSchema = z.object({
  client_type: z.enum(['residential', 'commercial']).default('residential'),
  customer_id: z.string().uuid().nullable().optional(),
  customer_name: z.string().min(1),
  customer_email: z.string().email().nullable().optional(),
  customer_address: z.string().nullable().optional(),
  sales_agent_id: z.string().uuid().nullable().optional(),
  sales_agent_name: z.string().nullable().optional(),
  items: z.array(quoteItemSchema).default([]),
  subtotal: z.number().min(0).default(0),
  discount_type: z.enum(['none', 'percentage', 'fixed']).default('none'),
  discount_value: z.number().min(0).default(0),
  discount_amount: z.number().min(0).default(0),
  vat_rate: z.number().min(0).default(20),
  vat_amount: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'declined', 'expired']).default('draft'),
  valid_until: z.string().datetime().nullable().optional(),
  template_style: z.enum(['modern', 'classic', 'minimal']).default('modern'),
  sent_date: z.string().datetime().nullable().optional(),
  discount_email_sent: z.boolean().default(false),
  followup_day7_sent: z.boolean().default(false),
  followup_day14_sent: z.boolean().default(false),
  reminder_date: z.string().datetime().nullable().optional(),
  reminder_time: z.string().nullable().optional(),
  reminder_note: z.string().nullable().optional(),
  reminder_done: z.boolean().default(false),
  images: z.array(z.string()).default([]),
});

export const quoteSelectSchema = baseSelectSchema.extend({
  ...quoteInsertSchema.shape,
  quote_number: z.string(),
  // Unguessable token for the public /quote/[token] page (never the sequential number).
  public_token: z.string(),
});

export const quoteUpdateSchema = quoteInsertSchema.partial();

export type QuoteItem = z.infer<typeof quoteItemSchema>;
export type QuoteInsert = z.infer<typeof quoteInsertSchema>;
export type Quote = z.infer<typeof quoteSelectSchema>;
export type QuoteUpdate = z.infer<typeof quoteUpdateSchema>;
