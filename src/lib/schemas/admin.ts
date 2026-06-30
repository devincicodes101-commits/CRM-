import { z } from "zod";
import { baseSelectSchema } from "./common";

// ─── Alert ────────────────────────────────────────────────────────────────────

export const alertInsertSchema = z.object({
  alert_type: z.enum(['low_rating', 'message', 'reminder', 'email_bounce']),
  title: z.string().min(1),
  message: z.string().min(1),
  job_id: z.string().uuid().nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  customer_name: z.string().nullable().optional(),
  customer_email: z.string().email().nullable().optional(),
  feedback_id: z.string().uuid().nullable().optional(),
  star_rating: z.number().int().min(1).max(5).nullable().optional(),
  feedback_text: z.string().nullable().optional(),
  status: z.enum(['active', 'resolved', 'archived']).default('active'),
  resolved_by: z.string().uuid().nullable().optional(),
  resolved_date: z.string().datetime().nullable().optional(),
  resolution_notes: z.string().nullable().optional(),
});

export const alertSelectSchema = baseSelectSchema.extend(alertInsertSchema.shape);
export const alertUpdateSchema = alertInsertSchema.partial();
export type AlertInsert = z.infer<typeof alertInsertSchema>;
export type Alert = z.infer<typeof alertSelectSchema>;

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const auditLogInsertSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  user_name: z.string().nullable().optional(),
  user_email: z.string().email().nullable().optional(),
  action: z.enum(['create', 'update', 'delete']),
  entity_type: z.string().min(1),
  entity_id: z.string().uuid().nullable().optional(),
  entity_name: z.string().nullable().optional(),
  details: z.string().nullable().optional(),
  changed_fields: z.array(z.string()).default([]),
});

export const auditLogSelectSchema = baseSelectSchema.extend(auditLogInsertSchema.shape);
export type AuditLogInsert = z.infer<typeof auditLogInsertSchema>;
export type AuditLog = z.infer<typeof auditLogSelectSchema>;

// ─── Bonus Settings ───────────────────────────────────────────────────────────

export const bonusSettingsInsertSchema = z.object({
  tier_name: z.string().nullable().optional(),
  min_star_rating: z.number().min(0).max(5),
  min_jobs_completed: z.number().int().min(0).nullable().optional(),
  max_completion_days: z.number().int().min(0).nullable().optional(),
  min_attendance_percentage: z.number().min(0).max(100).nullable().optional(),
  bonus_amount_gbp: z.number().min(0),
  is_active: z.boolean().default(true),
  priority: z.number().int().default(0),
});

export const bonusSettingsSelectSchema = baseSelectSchema.extend(bonusSettingsInsertSchema.shape);
export const bonusSettingsUpdateSchema = bonusSettingsInsertSchema.partial();
export type BonusSettingsInsert = z.infer<typeof bonusSettingsInsertSchema>;
export type BonusSettings = z.infer<typeof bonusSettingsSelectSchema>;

// ─── Commission Settings ──────────────────────────────────────────────────────

export const commissionSettingsInsertSchema = z.object({
  rate_percent: z.number().min(0).max(100).default(5),
  qualifying_statuses: z.array(z.string()).default(['accepted']),
  period: z.enum(['weekly', 'monthly']).default('weekly'),
});

export const commissionSettingsSelectSchema = baseSelectSchema.extend(commissionSettingsInsertSchema.shape);
export const commissionSettingsUpdateSchema = commissionSettingsInsertSchema.partial();
export type CommissionSettingsInsert = z.infer<typeof commissionSettingsInsertSchema>;
export type CommissionSettings = z.infer<typeof commissionSettingsSelectSchema>;

// ─── Operative Bonus ──────────────────────────────────────────────────────────

export const operativeBonusInsertSchema = z.object({
  operative_id: z.string().uuid(),
  operative_name: z.string().min(1),
  month_year: z.string().min(1),
  base_bonus: z.number().min(0).default(0),
  star_rating_bonus: z.number().min(0).default(0),
  job_performance_bonus: z.number().min(0).default(0),
  attendance_bonus: z.number().min(0).default(0),
  total_bonus: z.number().min(0).default(0),
  status: z.enum(['pending', 'approved', 'paid']).default('pending'),
  notes: z.string().nullable().optional(),
});

export const operativeBonusSelectSchema = baseSelectSchema.extend(operativeBonusInsertSchema.shape);
export const operativeBonusUpdateSchema = operativeBonusInsertSchema.partial();
export type OperativeBonusInsert = z.infer<typeof operativeBonusInsertSchema>;
export type OperativeBonus = z.infer<typeof operativeBonusSelectSchema>;

// ─── Prize Setting ────────────────────────────────────────────────────────────

export const prizeSettingInsertSchema = z.object({
  wheel_type: z.enum(['crm', 'field']),
  prize_description: z.string().min(1),
  prize_emoji: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const prizeSettingSelectSchema = baseSelectSchema.extend(prizeSettingInsertSchema.shape);
export const prizeSettingUpdateSchema = prizeSettingInsertSchema.partial();
export type PrizeSettingInsert = z.infer<typeof prizeSettingInsertSchema>;
export type PrizeSetting = z.infer<typeof prizeSettingSelectSchema>;

// ─── Feedback ─────────────────────────────────────────────────────────────────

export const feedbackInsertSchema = z.object({
  customer_name: z.string().min(1),
  customer_email: z.string().email().nullable().optional(),
  job_id: z.string().uuid().nullable().optional(),
  job_title: z.string().nullable().optional(),
  star_rating: z.number().int().min(1).max(5),
  feedback_text: z.string().min(1),
  submitted_date: z.string().datetime().optional(),
});

export const feedbackSelectSchema = baseSelectSchema.extend(feedbackInsertSchema.shape);
export const feedbackUpdateSchema = feedbackInsertSchema.partial();
export type FeedbackInsert = z.infer<typeof feedbackInsertSchema>;
export type Feedback = z.infer<typeof feedbackSelectSchema>;

// ─── Integration Connection ───────────────────────────────────────────────────

const integrationCredentialsSchema = z.object({
  api_key: z.string().optional(),
  api_secret: z.string().optional(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  publishable_key: z.string().optional(),
  phone_number_id: z.string().optional(),
  access_token: z.string().optional(),
}).nullable().optional();

export const integrationConnectionInsertSchema = z.object({
  integration_key: z.string().min(1),
  integration_name: z.string().min(1),
  category: z.enum(['Communications', 'Accounting', 'Payments', 'Calendar', 'Maps']),
  is_connected: z.boolean().default(false),
  credentials: integrationCredentialsSchema,
  connected_date: z.string().datetime().nullable().optional(),
  disconnected_date: z.string().datetime().nullable().optional(),
});

export const integrationConnectionSelectSchema = baseSelectSchema.extend(integrationConnectionInsertSchema.shape);
export const integrationConnectionUpdateSchema = integrationConnectionInsertSchema.partial();
export type IntegrationConnectionInsert = z.infer<typeof integrationConnectionInsertSchema>;
export type IntegrationConnection = z.infer<typeof integrationConnectionSelectSchema>;

// ─── Invited User ─────────────────────────────────────────────────────────────

export const invitedUserInsertSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  department: z.enum(['telesales', 'team', 'field', 'subcontractor']),
  role: z.string().nullable().optional(),
  status: z.enum(['pending', 'accepted']).default('pending'),
});

export const invitedUserSelectSchema = baseSelectSchema.extend(invitedUserInsertSchema.shape);
export const invitedUserUpdateSchema = invitedUserInsertSchema.partial();
export type InvitedUserInsert = z.infer<typeof invitedUserInsertSchema>;
export type InvitedUser = z.infer<typeof invitedUserSelectSchema>;

// ─── Signup Request ───────────────────────────────────────────────────────────

export const signupRequestInsertSchema = z.object({
  operative_name: z.string().min(1),
  email: z.string().email(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  rejection_reason: z.string().nullable().optional(),
  approved_by: z.string().uuid().nullable().optional(),
  approved_date: z.string().datetime().nullable().optional(),
});

export const signupRequestSelectSchema = baseSelectSchema.extend(signupRequestInsertSchema.shape);
export const signupRequestUpdateSchema = signupRequestInsertSchema.partial();
export type SignupRequestInsert = z.infer<typeof signupRequestInsertSchema>;
export type SignupRequest = z.infer<typeof signupRequestSelectSchema>;

// ─── Website Domain ───────────────────────────────────────────────────────────

export const websiteDomainInsertSchema = z.object({
  domain_name: z.string().min(1),
  domain_url: z.string().min(1),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  google_analytics_id: z.string().nullable().optional(),
  seo_focus_keywords: z.array(z.string()).default([]),
  monthly_traffic_goal: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_date_domain: z.string().datetime().nullable().optional(),
});

export const websiteDomainSelectSchema = baseSelectSchema.extend(websiteDomainInsertSchema.shape);
export const websiteDomainUpdateSchema = websiteDomainInsertSchema.partial();
export type WebsiteDomainInsert = z.infer<typeof websiteDomainInsertSchema>;
export type WebsiteDomain = z.infer<typeof websiteDomainSelectSchema>;
