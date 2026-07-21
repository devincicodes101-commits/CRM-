import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, Fuel, MapPin, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AsyncButton } from "@/components/ui/async-button";
import { updateVehicleStatus, deleteVehicle } from "@/app/(protected)/fleet/actions";
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

function isOverdue(d: string | null | undefined) {
  if (!d) return false;
  return new Date(d) < new Date();
}

function isDueSoon(d: string | null | undefined, days = 30) {
  if (!d) return false;
  const dt = new Date(d);
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + days);
  return dt >= now && dt <= soon;
}

function ComplianceRow({
  label,
  date,
}: {
  label: string;
  date: string | null | undefined;
}) {
  if (!date) return <Row label={label} value="Not set" />;
  const overdue = isOverdue(date);
  const soon = isDueSoon(date);
  return (
    <div className="flex gap-4">
      <dt className="w-32 shrink-0 text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm flex items-center gap-2">
        {new Date(date).toLocaleDateString("en-GB")}
        {overdue && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
            <AlertTriangle className="size-2.5" /> OVERDUE
          </span>
        )}
        {!overdue && soon && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400">
            <AlertTriangle className="size-2.5" /> Due soon
          </span>
        )}
      </dd>
    </div>
  );
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single<Vehicle>();

  if (!vehicle) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/fleet"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="size-4" /> Fleet
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-3 rounded-full shrink-0 mt-1",
                STATUS_COLOR[vehicle.status as keyof typeof STATUS_COLOR] ?? "bg-zinc-400"
              )}
            />
            <h1 className="text-2xl font-bold">{vehicle.name}</h1>
          </div>
          <p className="font-mono text-sm text-muted-foreground mt-0.5">{vehicle.registration}</p>
          <Badge
            variant={STATUS_VARIANT[vehicle.status as keyof typeof STATUS_VARIANT] ?? "outline"}
            className="capitalize mt-2"
          >
            {vehicle.status}
          </Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          {vehicle.status !== "active" && (
            <AsyncButton action={updateVehicleStatus.bind(null, id, "active")} size="sm">
              Set Active
            </AsyncButton>
          )}
          {vehicle.status !== "maintenance" && (
            <AsyncButton
              action={updateVehicleStatus.bind(null, id, "maintenance")}
              variant="outline"
              size="sm"
            >
              Maintenance
            </AsyncButton>
          )}
          {vehicle.status !== "offline" && (
            <AsyncButton
              action={updateVehicleStatus.bind(null, id, "offline")}
              variant="outline"
              size="sm"
            >
              Take Offline
            </AsyncButton>
          )}
          <Link
            href={`/fleet/vehicles/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Pencil className="size-4" /> Edit
          </Link>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Vehicle Info
          </h2>
          <dl className="space-y-2">
            {(vehicle.make || vehicle.model) && (
              <Row
                label="Make / Model"
                value={[vehicle.make, vehicle.model].filter(Boolean).join(" ")}
              />
            )}
            <Row label="Type" value={vehicle.type} />
            {vehicle.driver && <Row label="Driver" value={vehicle.driver} />}
          </dl>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Telemetry
          </h2>
          <dl className="space-y-2">
            <div className="flex gap-4">
              <dt className="w-32 shrink-0 text-muted-foreground text-sm">Fuel Level</dt>
              <dd className="flex items-center gap-2">
                <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      vehicle.fuel_level > 50
                        ? "bg-green-500"
                        : vehicle.fuel_level > 20
                        ? "bg-yellow-400"
                        : "bg-red-500"
                    )}
                    style={{ width: `${vehicle.fuel_level}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{vehicle.fuel_level}%</span>
              </dd>
            </div>
            <Row label="Mileage" value={`${vehicle.mileage.toLocaleString()} miles`} />
            {vehicle.current_location_name && (
              <div className="flex gap-4">
                <dt className="w-32 shrink-0 text-muted-foreground text-sm">Location</dt>
                <dd className="flex items-center gap-1 text-sm">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  {vehicle.current_location_name}
                  {vehicle.current_lat && vehicle.current_lng && (
                    <a
                      href={`https://www.google.com/maps?q=${vehicle.current_lat},${vehicle.current_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs ml-1"
                    >
                      Map
                    </a>
                  )}
                </dd>
              </div>
            )}
            {vehicle.last_updated && (
              <Row
                label="Last Updated"
                value={new Date(vehicle.last_updated).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            )}
          </dl>
        </div>
      </div>

      {/* Compliance */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Compliance & Maintenance
        </h2>
        <dl className="space-y-2">
          <ComplianceRow label="Service Due" date={vehicle.service_due_date} />
          <ComplianceRow label="MOT Due" date={vehicle.mot_due_date} />
          <ComplianceRow label="Insurance Expiry" date={vehicle.insurance_expiry_date} />
        </dl>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
        <h2 className="font-medium text-sm text-destructive uppercase tracking-wide">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete this vehicle record. This cannot be undone.
        </p>
        <AsyncButton action={deleteVehicle.bind(null, id)} variant="destructive" size="sm">
          Delete Vehicle
        </AsyncButton>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-32 shrink-0 text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm capitalize break-words">{value}</dd>
    </div>
  );
}