"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { userRoleSchema } from "@/lib/schemas/users";

export async function updateUserRole(
  userId: string,
  role: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return { error: "Forbidden" };

  const parsed = userRoleSchema.safeParse(role);
  if (!parsed.success) return { error: "Invalid role" };

  const service = await createServiceClient();
  const { error } = await service
    .from("users")
    .update({ role: parsed.data })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
}

export async function deactivateUser(userId: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return { error: "Forbidden" };
  if (userId === user.id) return { error: "Cannot deactivate yourself" };

  const service = await createServiceClient();
  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
}
