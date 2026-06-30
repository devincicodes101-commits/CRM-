import { z } from "zod";
import { baseSelectSchema } from "./common";

export const customerReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
  job_title: z.string().optional(),
  date: z.string().datetime().optional(),
});

export const customerInsertSchema = z.object({
  name: z.string().min(1),
  company: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  email_status: z.enum(['valid', 'bounced', 'complained']).default('valid'),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['lead', 'active', 'inactive']).default('lead'),
  client_type: z.enum(['domestic', 'commercial']).default('domestic'),
  total_spent: z.number().min(0).default(0),
  reviews: z.array(customerReviewSchema).default([]),
  average_rating: z.number().min(0).max(5).nullable().optional(),
});

export const customerSelectSchema = baseSelectSchema.extend(customerInsertSchema.shape);
export const customerUpdateSchema = customerInsertSchema.partial();

export type CustomerReview = z.infer<typeof customerReviewSchema>;
export type CustomerInsert = z.infer<typeof customerInsertSchema>;
export type Customer = z.infer<typeof customerSelectSchema>;
export type CustomerUpdate = z.infer<typeof customerUpdateSchema>;
