import { z } from "zod";

export const uuidSchema = z.string().uuid();

// Browser <input type="datetime-local"> emits "2026-08-20T14:00" (no seconds, no
// timezone), which z.string().datetime() rejects. Coerce that — and already-ISO
// strings — into a full ISO-8601 datetime. Empty/blank becomes null.
const coerceIso = (v: unknown): unknown => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toISOString();
  }
  return v;
};

export const isoDateTimeOptional = z.preprocess(
  coerceIso,
  z.string().datetime().nullable().optional(),
);

export const isoDateTimeRequired = z.preprocess(coerceIso, z.string().datetime());

export const baseSelectSchema = z.object({
  id: uuidSchema,
  created_date: z.string().datetime(),
  updated_date: z.string().datetime(),
  created_by_id: uuidSchema.nullable(),
});

export type BaseSelect = z.infer<typeof baseSelectSchema>;
