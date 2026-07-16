import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { AlertTriangle, Bell, Mail, Star } from "lucide-react";
import { ResolveAlertButton } from "./resolve-alert-button";

const ALERT_ICONS: Record<string, React.ReactNode> = {
  low_rating: <Star className="h-4 w-4 text-yellow-500" />,
  message: <Mail className="h-4 w-4 text-blue-500" />,
  reminder: <Bell className="h-4 w-4 text-purple-500" />,
  email_bounce: <AlertTriangle className="h-4 w-4 text-red-500" />,
};

const ALERT_COLORS: Record<string, string> = {
  low_rating: "border-l-yellow-400",
  message: "border-l-blue-400",
  reminder: "border-l-purple-400",
  email_bounce: "border-l-red-400",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-muted text-muted-foreground",
};

export default async function AlertsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!me || !["admin", "user"].includes(me.role)) redirect("/dashboard");

  const [activeRes, resolvedRes] = await Promise.all([
    supabase
      .from("alerts")
      .select("*")
      .eq("status", "active")
      .order("created_date", { ascending: false }),
    supabase
      .from("alerts")
      .select("*")
      .neq("status", "active")
      .order("created_date", { ascending: false })
      .limit(30),
  ]);

  const activeAlerts = activeRes.data ?? [];
  const resolvedAlerts = resolvedRes.data ?? [];

  const byType = {
    low_rating: activeAlerts.filter((a) => a.alert_type === "low_rating").length,
    message: activeAlerts.filter((a) => a.alert_type === "message").length,
    reminder: activeAlerts.filter((a) => a.alert_type === "reminder").length,
    email_bounce: activeAlerts.filter((a) => a.alert_type === "email_bounce").length,
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {activeAlerts.length} active alert
          {activeAlerts.length !== 1 ? "s" : ""} requiring attention
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(byType).map(([type, count]) =>
          count > 0 ? (
            <span
              key={type}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-background"
            >
              {ALERT_ICONS[type]}
              {count} {type.replace("_", " ")}
            </span>
          ) : null
        )}
        {activeAlerts.length === 0 && (
          <span className="text-sm text-green-600 font-medium">
            ✓ All clear — no active alerts
          </span>
        )}
      </div>

      {/* Active alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Active
          </h2>
          {activeAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              isAdmin={me.role === "admin"}
            />
          ))}
        </div>
      )}

      {/* Resolved / archived */}
      {resolvedAlerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recently Resolved
          </h2>
          {resolvedAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              isAdmin={me.role === "admin"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCard({
  alert,
  isAdmin,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  alert: Record<string, any>;
  isAdmin: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-l-4 ${ALERT_COLORS[alert.alert_type] ?? ""} p-4 bg-background`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5 shrink-0">
            {ALERT_ICONS[alert.alert_type] ?? (
              <Bell className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm">{alert.title}</p>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[alert.status] ?? ""}`}
              >
                {alert.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {alert.message}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
              {alert.customer_name && <span>{alert.customer_name}</span>}
              {alert.star_rating && (
                <span>{'★'.repeat(alert.star_rating)} ({alert.star_rating}/5)</span>
              )}
              <span>
                {format(new Date(alert.created_date), "d MMM yyyy HH:mm")}
              </span>
            </div>
            {alert.resolution_notes && (
              <p className="text-xs text-muted-foreground mt-1.5 italic">
                Resolution: {alert.resolution_notes}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {isAdmin && alert.status === "active" && (
          <div className="flex gap-2 shrink-0">
            <ResolveAlertButton alertId={alert.id} action="resolved" />
            <ResolveAlertButton alertId={alert.id} action="archived" />
          </div>
        )}
      </div>
    </div>
  );
}
