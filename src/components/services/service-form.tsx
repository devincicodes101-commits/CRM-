"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { serviceInsertSchema } from "@/lib/schemas/services";
import type { Service } from "@/lib/schemas/services";
import { createService, updateService } from "@/app/(protected)/services/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormValues = z.input<typeof serviceInsertSchema>;

const CATEGORIES = [
  "roofing", "plumbing", "electrical", "painting", "flooring",
  "landscaping", "demolition", "renovation", "concrete", "carpentry",
  "insulation", "asbestos", "general",
] as const;

const UNIT_TYPES = [
  { value: "per_sqm", label: "Per m²" },
  { value: "per_lm", label: "Per linear m" },
  { value: "per_hour", label: "Per hour" },
  { value: "per_day", label: "Per day" },
  { value: "fixed", label: "Fixed price" },
  { value: "per_unit", label: "Per unit" },
];

type Props = {
  service?: Service;
};

export function ServiceForm({ service }: Props) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!service;

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(serviceInsertSchema),
    defaultValues: service ?? {
      name: "",
      category: "general",
      description: "",
      unit_price: 0,
      unit_type: "fixed",
      estimated_duration: "",
      is_active: true,
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateService(service.id, values)
        : await createService(values);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Service Name *</Label>
          <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? "general"} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit_price">Unit Price (£) *</Label>
          <Input
            id="unit_price"
            type="number"
            step="0.01"
            min="0"
            {...register("unit_price", { valueAsNumber: true })}
            aria-invalid={!!errors.unit_price}
          />
          {errors.unit_price && <p className="text-xs text-destructive">{errors.unit_price.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Unit Type</Label>
          <Controller
            name="unit_type"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? "fixed"} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estimated_duration">Estimated Duration</Label>
          <Input id="estimated_duration" placeholder="e.g. 2-3 days" {...register("estimated_duration")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} rows={3} />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Service"}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}