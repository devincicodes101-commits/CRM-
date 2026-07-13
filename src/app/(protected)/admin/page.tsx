import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { UserRow } from "./user-row";
import type { UserRole } from "@/lib/schemas/users";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "admin") redirect("/dashboard");

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, role, created_date")
    .order("created_date", { ascending: true });

  const allUsers = users ?? [];

  const roleCounts = allUsers.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">{allUsers.length} users</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(roleCounts).map(([role, count]) => (
          <div key={role} className="rounded-lg border bg-card px-4 py-2 text-center min-w-20">
            <p className="text-lg font-bold">{count}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">User</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <UserRow
                key={u.id}
                user={u as { id: string; full_name: string; email: string; role: UserRole; created_date: string }}
                currentUserId={user.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
