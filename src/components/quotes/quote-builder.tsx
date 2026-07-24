"use client";

import { useTransition, useEffect } from "react";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { quoteInsertSchema } from "@/lib/schemas/quotes";
import type { Quote } from "@/lib/schemas/quotes";
import type { Service } from "@/lib/schemas/services";
import type { Customer } from "@/lib/schemas/customers";
import { createQuote, updateQuote } from "@/app/(protected)/quotes/actions";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FormValues = z.input<typeof quoteInsertSchema>;

type Props = {
  quote?: Quote;
  customers: Customer[];
  services: Service[];
};

function fmt(n: number) {
  return `£${n.toFixed(2)}`;
}

export function QuoteBuilder({ quote, customers, services }: Props) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!quote;

  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(quoteInsertSchema),
    defaultValues: quote ?? {
      client_type: "residential",
      customer_name: "",
      customer_email: "",
      customer_address: "",
      items: [],
      subtotal: 0,
      discount_type: "none",
      discount_value: 0,
      discount_amount: 0,
      vat_rate: 20,
      vat_amount: 0,
      total: 0,
      notes: "",
      status: "draft",
      template_style: "modern",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchedItems = useWatch({ control, name: "items" }) ?? [];
  const discountType = useWatch({ control, name: "discount_type" }) ?? "none";
  const discountValue = useWatch({ control, name: "discount_value" }) ?? 0;
  const vatRate = useWatch({ control, name: "vat_rate" }) ?? 20;
  const customerId = useWatch({ control, name: "customer_id" });

  const subtotal = watchedItems.reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 0);
    const price = Number(item?.unit_price ?? 0);
    return sum + qty * price;
  }, 0);

  const discountAmount =
    discountType === "percentage"
      ? (subtotal * Number(discountValue)) / 100
      : discountType === "fixed"
      ? Number(discountValue)
      : 0;

  const afterDiscount = subtotal - discountAmount;
  const vatAmount = (afterDiscount * Number(vatRate)) / 100;
  const total = afterDiscount + vatAmount;

  useEffect(() => {
    setValue("subtotal", subtotal);
    setValue("discount_amount", discountAmount);
    setValue("vat_amount", vatAmount);
    setValue("total", total);
  }, [subtotal, discountAmount, vatAmount, total, setValue]);

  useEffect(() => {
    if (!customerId) return;
    const c = customers.find((cu) => cu.id === customerId);
    if (c) {
      setValue("customer_name", c.name);
      setValue("customer_email", c.email ?? "");
      setValue("customer_address", c.address ?? "");
    }
  }, [customerId, customers, setValue]);

  function addItem(service?: Service) {
    append({
      service_id: service?.id,
      service_name: service?.name ?? "",
      description: service?.description ?? "",
      quantity: 1,
      unit_price: service?.unit_price ?? 0,
      unit_type: service?.unit_type,
      total: service?.unit_price ?? 0,
    });
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateQuote(quote.id, values)
        : await createQuote(values);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Customer */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Customer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Select Existing Customer</Label>
            <Controller
              name="customer_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Search customers…" />
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
            <Label>Client Type</Label>
            <Controller
              name="client_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? "residential"} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer_name">Customer Name *</Label>
            <Input id="customer_name" {...register("customer_name")} aria-invalid={!!errors.customer_name} />
            {errors.customer_name && <p className="text-xs text-destructive">{errors.customer_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer_email">Customer Email</Label>
            <Input id="customer_email" type="email" {...register("customer_email")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="customer_address">Address</Label>
            <Input id="customer_address" {...register("customer_address")} />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Line Items</h2>
          <div className="flex gap-2 flex-wrap">
            {services.slice(0, 5).map((s) => (
              <Button
                key={s.id}
                type="button"
                variant="outline"
                size="xs"
                onClick={() => addItem(s)}
              >
                + {s.name}
              </Button>
            ))}
            <Button type="button" variant="outline" size="xs" onClick={() => addItem()}>
              <Plus className="size-3" /> Custom
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
        <Table className="min-w-[620px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[240px]">Service / Description</TableHead>
              <TableHead className="w-[80px]">Qty</TableHead>
              <TableHead className="w-[110px]">Unit Price</TableHead>
              <TableHead className="w-[110px]">Total</TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No items yet. Add a service above.
                </TableCell>
              </TableRow>
            )}
            {fields.map((field, i) => {
              const qty = Number(watchedItems[i]?.quantity ?? 0);
              const price = Number(watchedItems[i]?.unit_price ?? 0);
              const rowTotal = qty * price;
              return (
                <TableRow key={field.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <Input
                        placeholder="Service name"
                        {...register(`items.${i}.service_name`)}
                        className="h-7 text-sm"
                      />
                      <Input
                        placeholder="Description (optional)"
                        {...register(`items.${i}.description`)}
                        className="h-7 text-xs text-muted-foreground"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-7 w-20"
                      {...register(`items.${i}.quantity`, { valueAsNumber: true })}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        setValue(`items.${i}.quantity`, v);
                        setValue(`items.${i}.total`, v * price);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-7 w-28"
                      {...register(`items.${i}.unit_price`, { valueAsNumber: true })}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        setValue(`items.${i}.unit_price`, v);
                        setValue(`items.${i}.total`, qty * v);
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{fmt(rowTotal)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Discount + VAT + Totals */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Discount Type</Label>
            <Controller
              name="discount_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No discount</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (£)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {discountType !== "none" && (
            <div className="space-y-1.5">
              <Label htmlFor="discount_value">
                {discountType === "percentage" ? "Discount %" : "Discount £"}
              </Label>
              <Input
                id="discount_value"
                type="number"
                min="0"
                step="0.01"
                {...register("discount_value", { valueAsNumber: true })}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="vat_rate">VAT Rate (%)</Label>
            <Input
              id="vat_rate"
              type="number"
              min="0"
              step="0.1"
              {...register("vat_rate", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Discount</span>
              <span>-{fmt(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT ({vatRate}%)</span>
            <span>{fmt(vatAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base border-t pt-2">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes + Settings */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Notes & Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Template Style</Label>
            <Controller
              name="template_style"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? "modern"} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valid_until">Valid Until</Label>
            <Input id="valid_until" type="datetime-local" {...register("valid_until")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes to Customer</Label>
          <Textarea id="notes" {...register("notes")} rows={3} placeholder="Payment terms, special conditions…" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Update Quote" : "Create Quote"}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}