"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition } from "react";
import { toast } from "sonner";
import { vehicleInsertSchema } from "@/lib/schemas/fleet";
import { createVehicle, updateVehicle } from "@/app/(protected)/fleet/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Vehicle } from "@/lib/schemas/fleet";

const schema = vehicleInsertSchema;
type FormValues = z.input<typeof schema>;

const VEHICLE_TYPES = ["van", "truck", "pickup", "car"] as const;
const STATUSES = ["active", "idle", "maintenance", "repair", "offline"] as const;

function toDateLocal(iso: string | null | undefined) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

type Props = { vehicle?: Vehicle };

export function VehicleForm({ vehicle }: Props) {
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: vehicle
      ? {
          ...vehicle,
          service_due_date: toDateLocal(vehicle.service_due_date) as unknown as string,
          mot_due_date: toDateLocal(vehicle.mot_due_date) as unknown as string,
          insurance_expiry_date: toDateLocal(vehicle.insurance_expiry_date) as unknown as string,
        }
      : {
          type: "van",
          status: "idle",
          fuel_level: 100,
          mileage: 0,
          speed: 0,
        },
  });

  const vehicleType = watch("type");
  const vehicleStatus = watch("status");

  function normalizeDate(v: string) {
    if (!v) return undefined;
    return new Date(v).toISOString();
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        service_due_date: normalizeDate(values.service_due_date as unknown as string),
        mot_due_date: normalizeDate(values.mot_due_date as unknown as string),
        insurance_expiry_date: normalizeDate(values.insurance_expiry_date as unknown as string),
      };
      const result = vehicle
        ? await updateVehicle(vehicle.id, payload)
        : await createVehicle(payload);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Identity */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Vehicle Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name / Nickname *</Label>
            <Input id="name" {...register("name")} placeholder="e.g. Van 1" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="registration">Registration *</Label>
            <Input id="registration" {...register("registration")} placeholder="AB12 CDE" className="uppercase" />
            {errors.registration && <p className="text-xs text-destructive">{errors.registration.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="make">Make</Label>
            <Input id="make" {...register("make")} placeholder="Ford" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model">Model</Label>
            <Input id="model" {...register("model")} placeholder="Transit" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={vehicleType}
              onValueChange={(v) => setValue("type", v as FormValues["type"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={vehicleStatus}
              onValueChange={(v) => setValue("status", v as FormValues["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Assignment + Telemetry */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Assignment & Telemetry</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="driver">Driver Name</Label>
            <Input id="driver" {...register("driver")} placeholder="Operative name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mileage">Mileage (miles)</Label>
            <Input
              id="mileage"
              type="number"
              min={0}
              {...register("mileage", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fuel_level">Fuel Level (%)</Label>
            <Input
              id="fuel_level"
              type="number"
              min={0}
              max={100}
              {...register("fuel_level", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="current_location_name">Current Location</Label>
            <Input id="current_location_name" {...register("current_location_name")} placeholder="e.g. Depot" />
          </div>
        </div>
      </div>

      {/* Compliance dates */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Compliance Dates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="service_due_date">Service Due</Label>
            <Input
              id="service_due_date"
              type="date"
              {...register("service_due_date" as never)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mot_due_date">MOT Due</Label>
            <Input
              id="mot_due_date"
              type="date"
              {...register("mot_due_date" as never)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="insurance_expiry_date">Insurance Expiry</Label>
            <Input
              id="insurance_expiry_date"
              type="date"
              {...register("insurance_expiry_date" as never)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : vehicle ? "Update Vehicle" : "Add Vehicle"}
        </Button>
      </div>
    </form>
  );
}