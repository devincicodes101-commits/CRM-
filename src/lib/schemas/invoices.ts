import { z } from "zod";
import { baseSelectSchema } from "./common";

export const invoiceItemSchema = z.object({
  service_name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().min(0),
  unit_price: z.number().min(0),
  total: z.number().min(0),
});

export const invoiceAttachmentSchema = z.object({
  url: z.string().min(1),
  name: z.string().min(1),
  uploaded_date: z.string().datetime().optional(),
});

export const invoiceInsertSchema = z.object({
  quote_id: z.string().uuid().nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  customer_name: z.string().min(1),
  customer_email: z.string().email().nullable().optional(),
  customer_address: z.string().nullable().optional(),
  invoice_type: z.enum(['standard', 'deposit', 'progress', 'final', 'credit_note']).default('standard'),
  billed_amount: z.number().min(0).nullable().optional(),
  items: z.array(invoiceItemSchema).default([]),
  subtotal: z.number().min(0).default(0),
  discount_type: z.enum(['none', 'percentage', 'fixed']).default('none'),
  discount_value: z.number().min(0).default(0),
  discount_amount: z.number().min(0).default(0),
  vat_rate: z.number().min(0).default(20),
  vat_amount: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  amount_paid: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
  status: z.enum(['draft', 'sent', 'part_paid', 'paid', 'overdue', 'cancelled']).default('draft'),
  due_date: z.string().datetime().nullable().optional(),
  sent_date: z.string().datetime().nullable().optional(),
  paid_date: z.string().datetime().nullable().optional(),
  payment_method: z.enum(['bank_transfer', 'credit_card', 'direct_debit']).nullable().optional(),
  attachments: z.array(invoiceAttachmentSchema).default([]),
});

export const invoiceSelectSchema = baseSelectSchema.extend({
  ...invoiceInsertSchema.shape,
  invoice_number: z.string(),
});

export const invoiceUpdateSchema = invoiceInsertSchema.partial();

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type InvoiceAttachment = z.infer<typeof invoiceAttachmentSchema>;
export type InvoiceInsert = z.infer<typeof invoiceInsertSchema>;
export type Invoice = z.infer<typeof invoiceSelectSchema>;
export type InvoiceUpdate = z.infer<typeof invoiceUpdateSchema>;
