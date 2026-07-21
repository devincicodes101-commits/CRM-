"use client";

import { useTransition, useEffect } from "react";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { invoiceInsertSchema } from "@/lib/schemas/invoices";
import type { Invoice } from "@/lib/schemas/invoices";
import type { Customer } from "@/lib/schemas/customers";
import { createInvoice, updateInvoice } from "@/app/(protected)/invoices/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type FormValues = z.input<typeof invoiceInsertSchema>;

type Props = { invoice?: Invoice; customers: Customer[] };

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function fmt(n: number) { return `£${n.toFixed(2)}`; }

const INVOICE_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "deposit", label: "Deposit" },
  { value: "progress", label: "Progress" },
  { value: "final", label: "Final" },
  { value: "credit_note", label: "Credit Note" },
];

export function InvoiceForm({ invoice, customers }: Props) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!invoice;

  const { register, control, handleSubmit, setValue, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(invoiceInsertSchema),
      defaultValues: invoice ? {
          ...invoice,
          due_date: toDatetimeLocal(invoice.due_date),
        } : {
        customer_name: "",
        customer_email: "",
        customer_address: "",
        invoice_type: "standard",
        items: [],
        subtotal: 0,
        discount_type: "none",
        discount_value: 0,
        discount_amount: 0,
        vat_rate: 20,
        vat_amount: 0,
        total: 0,
        amount_paid: 0,
        notes: "",
        status: "draft",
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchedItems = useWatch({ control, name: "items" }) ?? [];
  const discountType = useWatch({ control, name: "discount_type" }) ?? "none";
  const discountValue = useWatch({ control, name: "discount_value" }) ?? 0;
  const vatRate = useWatch({ control, name: "vat_rate" }) ?? 20;
  const customerId = useWatch({ control, name: "customer_id" });

  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (Number(item?.quantity ?? 0) * Number(item?.unit_price ?? 0)),
    0
  );
  const discountAmount =
    discountType === "percentage" ? (subtotal * Number(discountValue)) / 100
    : discountType === "fixed" ? Number(discountValue)
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
      setValue("customer_address",
        [c.address, c.city, c.postcode].filter(Boolean).join(", ") || "");
    }
  }, [customerId, customers, setValue]);

  function onSubmit(values: FormValues) {
    // datetime-local (due_date) is coerced to ISO by the zod schema.
    startTransition(async () => {
      const result = isEdit
        ? await updateInvoice(invoice.id, values)
        : await createInvoice(values);
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
            <Label>Existing Customer</Label>
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
            <Label>Invoice Type</Label>
            <Controller
              name="invoice_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? "standard"} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVOICE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
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
            <Label htmlFor="customer_email">Email</Label>
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
          <Button
            type="button" variant="outline" size="xs"
            onClick={() => append({ service_name: "", quantity: 1, unit_price: 0, total: 0 })}
          >
            <Plus className="size-3" /> Add Item
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Description</TableHead>
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
                  No items yet. Click "Add Item" above.
                </TableCell>
              </TableRow>
            )}
            {fields.map((field, i) => {
              const qty = Number(watchedItems[i]?.quantity ?? 0);
              const price = Number(watchedItems[i]?.unit_price ?? 0);
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
                      type="number" min="0" step="0.01" className="h-7 w-20"
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
                      type="number" min="0" step="0.01" className="h-7 w-28"
                      {...register(`items.${i}.unit_price`, { valueAsNumber: true })}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        setValue(`items.${i}.unit_price`, v);
                        setValue(`items.${i}.total`, qty * v);
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{fmt(qty * price)}</TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(i)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pricing */}
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
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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
              <Input id="discount_value" type="number" min="0" step="0.01"
                {...register("discount_value", { valueAsNumber: true })} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="vat_rate">VAT Rate (%)</Label>
            <Input id="vat_rate" type="number" min="0" step="0.1"
              {...register("vat_rate", { valueAsNumber: true })} />
          </div>
        </div>
        <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Discount</span><span>-{fmt(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT ({vatRate}%)</span><span>{fmt(vatAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base border-t pt-2">
            <span>Total</span><span>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" type="datetime-local" {...register("due_date")} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? "draft"} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="part_paid">Part Paid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register("notes")} rows={3} placeholder="Payment terms, bank details…" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Invoice"}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}