import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import type { AuditLog } from "@/lib/schemas/admin";

const ACTION_VARIANT = {
  create: "default",
  update: "secondary",
  delete: "destructive",
} as const;

export default async function AuditLogPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_date", { ascending: false })
    .limit(200)
    .returns<AuditLog[]>();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Settings
        </Link>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Last 200 actions</p>
      </div>

      {(!logs || logs.length === 0) ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">No audit entries yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-2.5 font-medium">When</th>
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Entity</th>
                <th className="px-4 py-2.5 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap text-xs">
                    {new Date(log.created_date).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-xs">{log.user_name ?? "System"}</p>
                    {log.user_email && (
                      <p className="text-xs text-muted-foreground">{log.user_email}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      variant={ACTION_VARIANT[log.action] ?? "outline"}
                      className="capitalize text-xs"
                    >
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-xs font-mono capitalize">
                      {log.entity_type}
                    </p>
                    {log.entity_name && (
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">{log.entity_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
                    {log.details ?? (log.changed_fields?.length > 0 ? log.changed_fields.join(", ") : "—")}
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