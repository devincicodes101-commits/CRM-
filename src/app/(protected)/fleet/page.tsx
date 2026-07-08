import Link from "next/link";
import { Plus, Truck, Fuel, MapPin, AlertTriangle, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Vehicle } from "@/lib/schemas/fleet";

const STATUS_VARIANT = {
  active: "default",
  idle: "secondary",
  maintenance: "outline",
  repair: "destructive",
  offline: "outline",
} as const;

const STATUS_COLOR = {
  active: "bg-green-500",
  idle: "bg-yellow-400",
  maintenance: "bg-blue-400",
  repair: "bg-red-500",
  offline: "bg-zinc-400",
} as const;

function isOverdue(dateStr: string | null | undefined) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function isDueSoon(dateStr: string | null | undefined, days = 30) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + days);
  return d >= now && d <= soon;
}

function ComplianceTag({ label, date }: { label: string; date: string | null | undefined }) {
  if (!date) return null;
  const overdue = isOverdue(date);
  const soon = isDueSoon(date);
  if (!overdue && !soon) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
        overdue
          ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400"
      )}
    >
      <AlertTriangle className="size-2.5" />
      {label} {overdue ? "OVERDUE" : "due soon"}
    </span>
  );
}

export default async function FleetPage() {
  const supabase = await createClient();

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .order("name")
    .returns<Vehicle[]>();

  const list = vehicles ?? [];
  const active = list.filter((v) => v.status === "active").length;
  const issues = list.filter((v) => ["maintenance", "repair", "offline"].includes(v.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fleet</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {list.length} vehicles · {active} active
            {issues > 0 && <span className="text-destructive ml-1">· {issues} need attention</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/fleet/attendance"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ClipboardList className="size-4" /> Attendance
          </Link>
          <Link
            href="/fleet/vehicles/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus className="size-4" /> Add Vehicle
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["active", "idle", "maintenance", "repair"] as const).map((s) => {
          const count = list.filter((v) => v.status === s).length;
          return (
            <div key={s} className="rounded-xl border bg-card p-4 flex items-center gap-3">
              <span className={cn("size-3 rounded-full shrink-0", STATUS_COLOR[s])} />
              <div>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground capitalize">{s}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vehicle list */}
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Truck className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No vehicles yet.</p>
          <Link
            href="/fleet/vehicles/new"
            className={cn(buttonVariants({ size: "sm" }), "mt-4")}
          >
            <Plus className="size-4" /> Add Vehicle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((v) => (
            <Link
              key={v.id}
              href={`/fleet/vehicles/${v.id}`}
              className="rounded-xl border bg-card p-4 hover:border-primary transition-colors space-y-3 block"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2.5 rounded-full shrink-0 mt-1", STATUS_COLOR[v.status as keyof typeof STATUS_COLOR] ?? "bg-zinc-400")} />
                  <div>
                    <p className="font-semibold">{v.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{v.registration}</p>
                  </div>
                </div>
                <Badge
                  variant={STATUS_VARIANT[v.status as keyof typeof STATUS_VARIANT] ?? "outline"}
                  className="capitalize text-xs shrink-0"
                >
                  {v.status}
                </Badge>
              </div>

              {/* Vehicle info */}
              <div className="text-sm text-muted-foreground space-y-1">
                {(v.make || v.model) && (
                  <p>{[v.make, v.model].filter(Boolean).join(" ")} · <span className="capitalize">{v.type}</span></p>
                )}
                {v.driver && <p>Driver: {v.driver}</p>}
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Fuel className="size-3" />
                  {v.fuel_level}%
                </span>
                {v.mileage > 0 && (
                  <span className="text-muted-foreground">
                    {v.mileage.toLocaleString()} mi
                  </span>
                )}
                {v.current_location_name && (
                  <span className="flex items-center gap-1 text-muted-foreground truncate">
                    <MapPin className="size-3 shrink-0" />
                    {v.current_location_name}
                  </span>
                )}
              </div>

              {/* Compliance warnings */}
              <div className="flex flex-wrap gap-1">
                <ComplianceTag label="Service" date={v.service_due_date} />
                <ComplianceTag label="MOT" date={v.mot_due_date} />
                <ComplianceTag label="Insurance" date={v.insurance_expiry_date} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}