"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendStaffMessage(data: {
  toEmail: string;
  subject: string;
  body: string;
}): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Sender is derived from the authenticated user — never trusted from the
  // client — so staff mail can't be spoofed as someone else.
  const { data: me } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single<{ full_name: string | null }>();

  const { error } = await supabase.from("staff_messages").insert({
    from_email: user.email,
    from_name: me?.full_name ?? user.email,
    to_email: data.toEmail,
    subject: data.subject,
    body: data.body,
    is_read: false,
    created_by_id: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/staff-mailbox");
}
