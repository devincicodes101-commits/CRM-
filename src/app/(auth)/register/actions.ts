"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/schemas/users";

export type RegisterActionState = { error: string } | { success: true } | null;

export async function registerUser(
  _prevState: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  // Only least-privileged roles may be self-assigned at signup. Staff
  // roles (admin/user-manager/sales/telesales/operative) are granted by an
  // admin via the admin panel — never from a public registration form.
  // This is enforced authoritatively in the DB trigger too (defense in depth).
  const requestedRole = String(formData.get("role") ?? "");
  const role: UserRole = requestedRole === "contractor" ? "contractor" : "user";

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect(role === "contractor" ? "/onboarding" : "/dashboard");
  }

  return { success: true };
}
