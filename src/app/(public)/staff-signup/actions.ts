"use server";

import { createServiceClient } from "@/lib/supabase/server";

// §13 — public operative signup request (admin approves before an account exists).
export async function submitStaffSignup(input: {
  name: string;
  email: string;
}): Promise<{ ok: true } | { error: string }> {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  if (!name) return { error: "Please enter your name" };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email" };

  const supabase = await createServiceClient();

  // Don't create a duplicate pending request for the same email.
  const { data: existing } = await supabase
    .from("signup_requests")
    .select("id")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle<{ id: string }>();
  if (existing) return { ok: true };

  const { error } = await supabase.from("signup_requests").insert({
    operative_name: name,
    email,
    status: "pending",
  });
  if (error) return { error: error.message };

  // Alert the office there's a request to review.
  await supabase.from("alerts").insert({
    alert_type: "message",
    title: "👤 New staff signup request",
    message: `${name} (${email}) has requested field-app access. Approve in Settings → Signup Requests.`,
    status: "active",
  });

  return { ok: true };
}
