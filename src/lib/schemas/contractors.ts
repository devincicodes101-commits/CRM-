import { z } from "zod";
import { baseSelectSchema } from "./common";

// ─── Contractor ───────────────────────────────────────────────────────────────

export const contractorInsertSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  company_name: z.string().nullable().optional(),
  contact_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  address_line1: z.string().nullable().optional(),
  address_line2: z.string().nullable().optional(),
  address_city: z.string().nullable().optional(),
  address_postcode: z.string().nullable().optional(),
  bank_account_name: z.string().nullable().optional(),
  bank_sort_code: z.string().nullable().optional(),
  bank_account_number: z.string().nullable().optional(),
  vat_registered: z.boolean().default(false),
  vat_number: z.string().nullable().optional(),
  registration_completed: z.boolean().default(false),
});

export const contractorSelectSchema = baseSelectSchema.extend(contractorInsertSchema.shape);
export const contractorUpdateSchema = contractorInsertSchema.partial();

export type ContractorInsert = z.infer<typeof contractorInsertSchema>;
export type Contractor = z.infer<typeof contractorSelectSchema>;
export type ContractorUpdate = z.infer<typeof contractorUpdateSchema>;

// ─── Subcontractor ────────────────────────────────────────────────────────────

export const subcontractorInsertSchema = z.object({
  name: z.string().min(1),
  company_name: z.string().nullable().optional(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  covered_areas: z.array(z.string()).default([]),
  service_categories: z.array(z.string()).default([]),
  starting_postcode: z.string().nullable().optional(),
  max_radius_miles: z.number().int().positive().nullable().optional(),
  status: z.enum(['pending', 'active', 'inactive']).default('pending'),
  rating: z.number().min(0).max(5).default(0),
  completed_jobs: z.number().int().min(0).default(0),
  notes: z.string().nullable().optional(),
});

export const subcontractorSelectSchema = baseSelectSchema.extend(subcontractorInsertSchema.shape);
export const subcontractorUpdateSchema = subcontractorInsertSchema.partial();

export type SubcontractorInsert = z.infer<typeof subcontractorInsertSchema>;
export type Subcontractor = z.infer<typeof subcontractorSelectSchema>;
export type SubcontractorUpdate = z.infer<typeof subcontractorUpdateSchema>;

// ─── Job Bid ──────────────────────────────────────────────────────────────────

export const jobBidInsertSchema = z.object({
  job_id: z.string().uuid(),
  job_title: z.string().nullable().optional(),
  job_start_date: z.string().datetime().nullable().optional(),
  job_address: z.string().nullable().optional(),
  job_description: z.string().nullable().optional(),
  subcontractor_id: z.string().uuid(),
  subcontractor_name: z.string().nullable().optional(),
  subcontractor_company: z.string().nullable().optional(),
  amount: z.number().min(0),
  estimated_days: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'withdrawn']).default('pending'),
});

export const jobBidSelectSchema = baseSelectSchema.extend(jobBidInsertSchema.shape);
export const jobBidUpdateSchema = jobBidInsertSchema.partial();

export type JobBidInsert = z.infer<typeof jobBidInsertSchema>;
export type JobBid = z.infer<typeof jobBidSelectSchema>;
export type JobBidUpdate = z.infer<typeof jobBidUpdateSchema>;
