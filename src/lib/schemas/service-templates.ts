import { z } from "zod";
import { baseSelectSchema } from "./common";

export const serviceTemplateItemSchema = z.object({
  service_id: z.string().uuid(),
  service_name: z.string().min(1),
  description: z.string().optional(),
  unit_price: z.number().min(0),
  unit_type: z.string().optional(),
  quantity: z.number().min(0).default(1),
});

export const serviceTemplateInsertSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  items: z.array(serviceTemplateItemSchema).default([]),
});

export const serviceTemplateSelectSchema = baseSelectSchema.extend(
  serviceTemplateInsertSchema.shape,
);

export type ServiceTemplateItem = z.infer<typeof serviceTemplateItemSchema>;
export type ServiceTemplateInsert = z.infer<typeof serviceTemplateInsertSchema>;
export type ServiceTemplate = z.infer<typeof serviceTemplateSelectSchema>;
