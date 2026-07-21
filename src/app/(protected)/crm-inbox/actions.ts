"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { error: string };

async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Not authenticated" as const };
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!me || !["admin", "user", "sales", "telesales"].includes(me.role)) return { supabase, error: "Forbidden" as const };
  return { supabase, error: null };
}

// Reply to a customer conversation (adds an admin message, marks the thread answered).
export async function replyInInbox(input: {
  conversationId: string | null;
  customerEmail: string;
  customerName: string;
  content: string;
}): Promise<ActionResult> {
  if (!input.content.trim()) return { error: "Message is empty" };
  const { supabase, error } = await requireStaff();
  if (error) return { error };

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

  // Mark the customer's messages in this conversation as answered.
  let q = supabase.from("messages").update({ status: "answered" }).eq("sender_type", "customer");
  q = input.conversationId ? q.eq("conversation_id", input.conversationId) : q.eq("customer_email", input.customerEmail);
  await q;

  revalidatePath("/crm-inbox");
  return { ok: true };
}

// Mark a conversation's incoming messages as read.
export async function markInboxRead(conversationId: string | null, customerEmail: string): Promise<ActionResult> {
  const { supabase, error } = await requireStaff();
  if (error) return { error };
  let q = supabase.from("messages").update({ is_read: true }).eq("sender_type", "customer");
  q = conversationId ? q.eq("conversation_id", conversationId) : q.eq("customer_email", customerEmail);
  const { error: err } = await q;
  if (err) return { error: err.message };
  revalidatePath("/crm-inbox");
  return { ok: true };
}
