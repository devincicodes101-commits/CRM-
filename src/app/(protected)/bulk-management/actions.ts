"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function bulkUpdateStatus(
  jobIds: string[],
  status: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("jobs")
    .update({ status, updated_date: new Date().toISOString() })
    .in("id", jobIds);

  if (error) return { error: error.message };
  revalidatePath("/bulk-management");
  revalidatePath("/jobs");
}

export async function bulkAssignTeam(
  jobIds: string[],
  teamName: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("jobs")
    .update({ assigned_team: teamName, updated_date: new Date().toISOString() })
    .in("id", jobIds);

  if (error) return { error: error.message };
  revalidatePath("/bulk-management");
}

export async function exportJobsCSV(
  jobIds: string[]
): Promise<{ csv: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("title, customer_name, status, start_date, end_date, total_value, assigned_team, address, notes")
    .in("id", jobIds)
    .order("start_date");

  if (error) return { error: error.message };

  const headers = ["Title", "Customer", "Status", "Start Date", "End Date", "Value (£)", "Team", "Address", "Notes"];
  const rows = (jobs ?? []).map(j => [
    j.title,
    j.customer_name ?? "",
    j.status,
    j.start_date ? new Date(j.start_date).toLocaleDateString("en-GB") : "",
    j.end_date ? new Date(j.end_date).toLocaleDateString("en-GB") : "",
    Number(j.total_value ?? 0).toFixed(2),
    j.assigned_team ?? "",
    (j.address ?? "").replace(/,/g, ";"),
    (j.notes ?? "").replace(/,/g, ";").replace(/\n/g, " "),
  ]);

  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  return { csv };
}
