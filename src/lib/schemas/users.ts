import { z } from "zod";
import { baseSelectSchema } from "./common";

export const USER_ROLES = ['admin', 'user', 'operative', 'sales', 'telesales', 'contractor'] as const;
export const userRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userInsertSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema.default('user'),
  avatar_url: z.string().url().nullable().optional(),
  nav_permissions: z.array(z.string()).default([]),
  mobile_number: z.string().nullable().optional(),
});

export const userSelectSchema = baseSelectSchema
  .omit({ created_by_id: true })
  .extend(userInsertSchema.shape);

export const userUpdateSchema = userInsertSchema.partial();

export type UserInsert = z.infer<typeof userInsertSchema>;
export type User = z.infer<typeof userSelectSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;

// ─── Company Settings ─────────────────────────────────────────────────────────

export const companySettingsInsertSchema = z.object({
  company_name: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  sender_email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  base_url: z.string().nullable().optional(),
  vat_number: z.string().nullable().optional(),
  company_number: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  primary_color: z.string().default('#f97316'),
  quote_footer_text: z.string().nullable().optional(),
  invoice_footer_text: z.string().nullable().optional(),
  bank_account_name: z.string().nullable().optional(),
  bank_sort_code: z.string().nullable().optional(),
  bank_account_number: z.string().nullable().optional(),
  terms_and_conditions: z.string().nullable().optional(),
  role_permissions: z.record(z.string(), z.unknown()).default({}),
  opening_time: z.string().default('09:00'),
  closing_time: z.string().default('17:30'),
  working_days: z.array(z.number().int()).default([1, 2, 3, 4, 5]),
  business_timezone: z.string().default('Europe/London'),
  default_labour_rate: z.number().positive().nullable().optional(),
  monthly_marketing_spend: z.number().positive().nullable().optional(),
  new_lead_sequence_start_date: z.string().datetime().nullable().optional(),
});

export const companySettingsSelectSchema = baseSelectSchema.extend(companySettingsInsertSchema.shape);
export const companySettingsUpdateSchema = companySettingsInsertSchema.partial();

export type CompanySettingsInsert = z.infer<typeof companySettingsInsertSchema>;
export type CompanySettings = z.infer<typeof companySettingsSelectSchema>;
export type CompanySettingsUpdate = z.infer<typeof companySettingsUpdateSchema>;
