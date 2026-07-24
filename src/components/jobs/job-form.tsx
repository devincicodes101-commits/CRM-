"use client";

import { useTransition, useState, useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Search, X } from "lucide-react";
import { jobInsertSchema } from "@/lib/schemas/jobs";
import type { Job } from "@/lib/schemas/jobs";
import type { Customer } from "@/lib/schemas/customers";
import type { Quote } from "@/lib/schemas/quotes";
import { createJob, updateJob } from "@/app/(protected)/jobs/actions";
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

type FormValues = z.input<typeof jobInsertSchema>;

type ServiceOption = { id: string; name: string; category: string; unit_price: number; unit_type: string };
type VehicleOption = { id: string; name: string; registration: string };
type OperativeOption = { id: string; full_name: string; role: string };
type ContractorOption = { id: string; contact_name: string; company_name: string | null };

type Props = {
  job?: Job;
  customers: Customer[];
  quotes?: Pick<Quote, "id" | "quote_number" | "customer_name">[];
  services?: ServiceOption[];
  vehicles?: VehicleOption[];
  operatives?: OperativeOption[];
  contractors?: ContractorOption[];
};

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "on_hold", label: "On Hold" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "invoiced", label: "Invoiced" },
  { value: "awaiting_payment", label: "Awaiting Payment" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function JobForm({
  job,
  customers,
  quotes = [],
  services = [],
  vehicles = [],
  operatives = [],
  contractors = [],
}: Props) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!job;

  // Services multiselect: adding a service builds the title, sums the job value.
  const [selectedServices, setSelectedServices] = useState<ServiceOption[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const serviceResults = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    const chosen = new Set(selectedServices.map((s) => s.id));
    return services
      .filter((s) => !chosen.has(s.id))
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
      .slice(0, 8);
  }, [services, serviceSearch, selectedServices]);

  const { register, control, handleSubmit, setValue, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(jobInsertSchema),
      defaultValues: job
        ? {
            ...job,
            start_date: toDatetimeLocal(job.start_date),
            end_date: toDatetimeLocal(job.end_date),
          }
        : {
            title: "",
            customer_name: "",
            customer_email: "",
            address: "",
            description: "",
            start_date: "",
            status: "scheduled",
            priority: "medium",
            total_value: 0,
            color: "#f97316",
            notes: "",
            client_photos: [],
            materials_used: [],
            // Default field checklist (operatives tick these off on site). Remove any
            // that don't apply — mirrors Base44's auto-populated checklist.
            checklist: [
              { label: "Site safety check done", checked: false },
              { label: "Customer briefed", checked: false },
              { label: "Work area cleared", checked: false },
              { label: "Photos taken", checked: false },
              { label: "Waste removed / disposed", checked: false },
            ],
            reminder_24h_sent: false,
            arrival_confirmed: false,
          },
    });

  const { fields: checklistFields, append: appendChecklist, remove: removeChecklist } =
    useFieldArray({ control, name: "checklist" });

  function handleCustomerChange(customerId: string | null) {
    if (!customerId) return;
    setValue("customer_id", customerId || undefined);
    const c = customers.find((cu) => cu.id === customerId);
    if (c) {
      setValue("customer_name", c.name);
      setValue("customer_email", c.email ?? "");
      if (c.address) setValue("address", c.address);
    }
  }

  // Adding/removing a service rebuilds the title, description and job value.
  function syncFromServices(list: ServiceOption[]) {
    setSelectedServices(list);
    const names = list.map((s) => s.name);
    if (names.length) {
      setValue("title", names.join(", ").slice(0, 120));
      setValue("description", names.join(", "));
    }
    setValue("total_value", list.reduce((sum, s) => sum + (s.unit_price || 0), 0));
  }
  function addService(s: ServiceOption) {
    syncFromServices([...selectedServices, s]);
    setServiceSearch("");
  }
  function removeService(id: string) {
    syncFromServices(selectedServices.filter((s) => s.id !== id));
  }

  function onSubmit(values: FormValues) {
    // datetime-local strings are coerced to ISO by the zod schema (isoDateTime*).
    startTransition(async () => {
      const result = isEdit
        ? await updateJob(job.id, values)
        : await createJob(values);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Core info */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Job Details</h2>

        {services.length > 0 && (
          <div className="space-y-1.5">
            <Label>Services</Label>
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {selectedServices.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-1"
                  >
                    {s.name} · £{s.unit_price}
                    <button type="button" onClick={() => removeService(s.id)} className="hover:text-destructive">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search services to add…"
                className="pl-8"
              />
              {serviceSearch && serviceResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
                  {serviceResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addService(s)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span>
                        {s.name}
                        <span className="text-muted-foreground text-xs ml-2 capitalize">{s.category} · {s.unit_type.replace("_", " ")}</span>
                      </span>
                      <span className="font-medium">£{s.unit_price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input id="title" {...register("title")} aria-invalid={!!errors.title} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Customer</Label>
            <Controller
              name="customer_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => v && handleCustomerChange(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select customer…" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer_name">Customer Name</Label>
            <Input id="customer_name" {...register("customer_name")} />
          </div>
          {quotes.length > 0 && (
            <div className="space-y-1.5">
              <Label>Linked Quote</Label>
              <Controller
                name="quote_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      {quotes.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          #{q.quote_number} — {q.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Site Address</Label>
            <Input id="address" {...register("address")} placeholder="Full address including postcode" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} rows={2} />
        </div>
      </div>

      {/* Scheduling */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Scheduling</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="start_date">Start Date/Time *</Label>
            <Input
              id="start_date"
              type="datetime-local"
              {...register("start_date")}
              aria-invalid={!!errors.start_date}
            />
            {errors.start_date && (
              <p className="text-xs text-destructive">{errors.start_date.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end_date">End Date/Time</Label>
            <Input id="end_date" type="datetime-local" {...register("end_date")} />
          </div>
          <div className="space-y-1.5">
            <Label>Assign Operative</Label>
            {operatives.length > 0 ? (
              <Controller
                name="assigned_team"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => {
                      field.onChange(v || null);
                      if (v) setValue("assigned_contractor_id", null); // operative & contractor are mutually exclusive
                    }}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select operative…" /></SelectTrigger>
                    <SelectContent>
                      {operatives.map((o) => (
                        <SelectItem key={o.id} value={o.full_name}>{o.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <Input {...register("assigned_team")} placeholder="Name or team" />
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Assign Vehicle</Label>
            {vehicles.length > 0 ? (
              <Controller
                name="assigned_vehicle"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select vehicle…" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.name}>{v.name} ({v.registration})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <Input {...register("assigned_vehicle")} placeholder="Vehicle reg or name" />
            )}
          </div>
          {contractors.length > 0 && (
            <div className="space-y-1.5">
              <Label>Assign Contractor (External)</Label>
              <Controller
                name="assigned_contractor_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => {
                      field.onChange(v || null);
                      if (v) setValue("assigned_team", null); // contractor clears operative
                    }}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Choose contractor…" /></SelectTrigger>
                    <SelectContent>
                      {contractors.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.company_name || c.contact_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? "scheduled"} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? "medium"} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="total_value">Job Value (£)</Label>
            <Input
              id="total_value"
              type="number"
              step="0.01"
              min="0"
              {...register("total_value", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="color">Calendar Colour</Label>
            <Input id="color" type="color" {...register("color")} className="h-8 w-16 p-1 cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Checklist</h2>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => appendChecklist({ label: "", checked: false })}
          >
            <Plus className="size-3" /> Add Item
          </Button>
        </div>
        {checklistFields.length === 0 && (
          <p className="text-sm text-muted-foreground">No checklist items.</p>
        )}
        {checklistFields.map((field, i) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              {...register(`checklist.${i}.label`)}
              placeholder={`Item ${i + 1}`}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeChecklist(i)}
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Internal Notes</Label>
        <Textarea id="notes" {...register("notes")} rows={3} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Job"}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}