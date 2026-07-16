"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateCommissionInvoiceStatus(
  invoiceId: string,
  status: "sent" | "paid" | "cancelled"
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!me || me.role !== "admin") return { error: "Admin only" };

  const update: Record<string, unknown> = { status };
  if (status === "sent") update.sent_date = new Date().toISOString();
  if (status === "paid") update.paid_date = new Date().toISOString();

  const { error } = await supabase
    .from("commission_invoices")
    .update(update)
    .eq("id", invoiceId);

  if (error) return { error: error.message };
  revalidatePath("/commission-invoices");
}
