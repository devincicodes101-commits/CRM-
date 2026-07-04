"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { subcontractorInsertSchema } from "@/lib/schemas/contractors";
import type { Subcontractor } from "@/lib/schemas/contractors";
import { createSubcontractor, updateSubcontractor } from "@/app/(protected)/contractors/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type FormValues = z.input<typeof subcontractorInsertSchema>;
type Props = { subcontractor?: Subcontractor };

export function SubcontractorForm({ subcontractor }: Props) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!subcontractor;

  const { register, control, handleSubmit, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(subcontractorInsertSchema),
      defaultValues: subcontractor
        ? {
            ...subcontractor,
            covered_areas: (subcontractor.covered_areas?.join(", ") ?? "") as unknown as string[],
            service_categories: (subcontractor.service_categories?.join(", ") ?? "") as unknown as string[],
          }
        : {
            name: "",
            company_name: "",
            email: "",
            phone: "",
            starting_postcode: "",
            max_radius_miles: undefined,
            covered_areas: [] as unknown as string[],
            service_categories: [] as unknown as string[],
            status: "pending" as const,
            rating: 0,
            completed_jobs: 0,
            notes: "",
          },
    });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateSubcontractor(subcontractor.id, values)
        : await createSubcontractor(values);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company_name">Company</Label>
            <Input id="company_name" {...register("company_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Coverage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="starting_postcode">Base Postcode</Label>
            <Input id="starting_postcode" {...register("starting_postcode")} placeholder="e.g. SW1A 1AA" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max_radius_miles">Max Radius (miles)</Label>
            <Input
              id="max_radius_miles"
              type="number"
              min="1"
              {...register("max_radius_miles", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="covered_areas">Covered Areas (comma-separated)</Label>
            <Input
              id="covered_areas"
              placeholder="e.g. London, Birmingham, Manchester"
              {...register("covered_areas", {
                setValueAs: (v) =>
                  typeof v === "string" ? v.split(",").map((s: string) => s.trim()).filter(Boolean) : v,
              })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="service_categories">Service Categories (comma-separated)</Label>
            <Input
              id="service_categories"
              placeholder="e.g. Plumbing, Electrical, Roofing"
              {...register("service_categories", {
                setValueAs: (v) =>
                  typeof v === "string" ? v.split(",").map((s: string) => s.trim()).filter(Boolean) : v,
              })}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? "pending"} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rating">Rating (0–5)</Label>
            <Input id="rating" type="number" min="0" max="5" step="0.1"
              {...register("rating", { valueAsNumber: true })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register("notes")} rows={3} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save Changes" : "Add Subcontractor"}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
