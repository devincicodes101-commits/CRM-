"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error: string } | { ok: true };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// ── Reschedule requests ───────────────────────────────────────
export async function approveReschedule(
  requestId: string,
  jobId: string,
  requestedDate: string
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };

  const { error: reqErr } = await supabase
    .from("reschedule_requests")
    .update({ status: "approved" })
    .eq("id", requestId);
  if (reqErr) return { error: reqErr.message };

  const { error: jobErr } = await supabase
    .from("jobs")
    .update({ start_date: requestedDate })
    .eq("id", jobId);
  if (jobErr) return { error: jobErr.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function rejectReschedule(requestId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("reschedule_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

// ── Low-rating alerts ─────────────────────────────────────────
export async function resolveAlert(alertId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("alerts")
    .update({
      status: "resolved",
      resolved_by: user.id,
      resolved_date: new Date().toISOString(),
    })
    .eq("id", alertId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function archiveAlert(alertId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("alerts")
    .update({ status: "archived" })
    .eq("id", alertId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

// ── Customer message reply ────────────────────────────────────
export async function replyToMessage(input: {
  conversationId: string | null;
  customerEmail: string;
  customerName: string;
  content: string;
}): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };
  if (!input.content.trim()) return { error: "Message is empty" };

  const { error: insertErr } = await supabase.from("messages").insert({
    conversation_id: input.conversationId,
    customer_email: input.customerEmail,
    customer_name: input.customerName,
    content: input.content.trim(),
    sender_type: "admin",
    status: "answered",
    is_read: true,
  });
  if (insertErr) return { error: insertErr.message };

  // Mark the customer's open messages in this conversation as answered.
  if (input.conversationId) {
    await supabase
      .from("messages")
      .update({ status: "answered" })
      .eq("conversation_id", input.conversationId)
      .eq("sender_type", "customer");
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
