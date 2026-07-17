import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BulkJobsTable } from "./bulk-jobs-table";

export default async function BulkManagementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!me || !["admin", "user"].includes(me.role)) redirect("/dashboard");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, customer_name, status, start_date, total_value, assigned_team")
    .order("start_date", { ascending: false })
    .limit(200);

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, role")
    .in("role", ["operative", "user"]);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">Bulk Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select multiple records to update status, reassign team, or export data
        </p>
      </div>
      <BulkJobsTable jobs={jobs ?? []} teamMembers={users ?? []} />
    </div>
  );
}
