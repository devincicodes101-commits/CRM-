"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  jobId: z.string().uuid(),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  jobTitle: z.string().optional(),
  originalDate: z.string().optional(),
  requestedDate: z.string().min(1),
  reason: z.string().optional(),
});

export async function submitRescheduleRequest(
  values: unknown
): Promise<{ error: string } | { success: true }> {
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { error: "Invalid request data" };

  const supabase = await createServiceClient();

  const { error } = await supabase.from("reschedule_requests").insert({
    job_id: parsed.data.jobId,
    customer_email: parsed.data.customerEmail,
    customer_name: parsed.data.customerName,
    job_title: parsed.data.jobTitle ?? null,
    original_date: parsed.data.originalDate ?? null,
    requested_date: new Date(parsed.data.requestedDate).toISOString(),
    reason: parsed.data.reason ?? null,
    status: "pending",
    request_date: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  return { success: true };
}
