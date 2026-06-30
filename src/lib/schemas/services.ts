import { z } from "zod";
import { baseSelectSchema } from "./common";

export const serviceInsertSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['roofing', 'plumbing', 'electrical', 'painting', 'flooring', 'landscaping', 'demolition', 'renovation', 'concrete', 'carpentry', 'insulation', 'asbestos', 'general']).default('general'),
  description: z.string().nullable().optional(),
  unit_price: z.number().min(0),
  unit_type: z.enum(['per_sqm', 'per_lm', 'per_hour', 'per_day', 'fixed', 'per_unit']).default('fixed'),
  estimated_duration: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  video_prompt: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  media_type: z.enum(['ai_generated', 'uploaded', 'linked']).default('ai_generated'),
  is_active: z.boolean().default(true),
});

export const serviceSelectSchema = baseSelectSchema.extend(serviceInsertSchema.shape);
export const serviceUpdateSchema = serviceInsertSchema.partial();

export type ServiceInsert = z.infer<typeof serviceInsertSchema>;
export type Service = z.infer<typeof serviceSelectSchema>;
export type ServiceUpdate = z.infer<typeof serviceUpdateSchema>;
