import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { InviteForm } from "@/components/settings/invite-form";
import type { InvitedUser } from "@/lib/schemas/admin";

export default async function TeamPage() {
  const supabase = await createClient();

  const { data: invites } = await supabase
    .from("invited_users")
    .select("*")
    .order("created_date", { ascending: false })
    .returns<InvitedUser[]>();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Settings
        </Link>
        <h1 className="text-2xl font-bold">Team & Invites</h1>
      </div>

      <InviteForm />

      {invites && invites.length > 0 && (
        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="font-medium text-sm">Pending & Accepted Invites</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Department</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Invited</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium">{inv.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{inv.email}</td>
                  <td className="px-4 py-2.5 capitalize">{inv.department}</td>
                  <td className="px-4 py-2.5">
                    <Badge
                      variant={inv.status === "accepted" ? "default" : "secondary"}
                      className="capitalize text-xs"
                    >
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {new Date(inv.created_date).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}