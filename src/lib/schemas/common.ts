import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const baseSelectSchema = z.object({
  id: uuidSchema,
  created_date: z.string().datetime(),
  updated_date: z.string().datetime(),
  created_by_id: uuidSchema.nullable(),
});

export type BaseSelect = z.infer<typeof baseSelectSchema>;
