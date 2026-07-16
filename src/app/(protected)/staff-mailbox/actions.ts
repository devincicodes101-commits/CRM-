"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendStaffMessage(data: {
  fromEmail: string;
  fromName: string;
  toEmail: string;
  subject: string;
  body: string;
}): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("staff_messages").insert({
    from_email: data.fromEmail,
    from_name: data.fromName,
    to_email: data.toEmail,
    subject: data.subject,
    body: data.body,
    is_read: false,
    created_by_id: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/staff-mailbox");
}
