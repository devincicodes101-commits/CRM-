"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { contractorInsertSchema } from "@/lib/schemas/contractors";
import type { Contractor } from "@/lib/schemas/contractors";
import { createContractor, updateContractor } from "@/app/(protected)/contractors/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type FormValues = z.input<typeof contractorInsertSchema>;
type Props = { contractor?: Contractor };

export function ContractorForm({ contractor }: Props) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!contractor;

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(contractorInsertSchema),
      defaultValues: contractor ?? {
        contact_name: "",
        email: "",
        phone: "",
        company_name: "",
        address_line1: "",
        address_line2: "",
        address_city: "",
        address_postcode: "",
        vat_registered: false,
        vat_number: "",
        bank_account_name: "",
        bank_sort_code: "",
        bank_account_number: "",
        registration_completed: false,
      },
    });

  const vatRegistered = watch("vat_registered");

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateContractor(contractor.id, values)
        : await createContractor(values);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Contact */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="contact_name">Contact Name *</Label>
            <Input id="contact_name" {...register("contact_name")} aria-invalid={!!errors.contact_name} />
            {errors.contact_name && <p className="text-xs text-destructive">{errors.contact_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company_name">Company Name</Label>
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

      {/* Address */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Address</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address_line1">Address Line 1</Label>
            <Input id="address_line1" {...register("address_line1")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input id="address_line2" {...register("address_line2")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address_city">City</Label>
            <Input id="address_city" {...register("address_city")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address_postcode">Postcode</Label>
            <Input id="address_postcode" {...register("address_postcode")} />
          </div>
        </div>
      </div>

      {/* Bank */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Bank Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="bank_account_name">Account Name</Label>
            <Input id="bank_account_name" {...register("bank_account_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank_sort_code">Sort Code</Label>
            <Input id="bank_sort_code" placeholder="00-00-00" {...register("bank_sort_code")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank_account_number">Account Number</Label>
            <Input id="bank_account_number" {...register("bank_account_number")} />
          </div>
        </div>
      </div>

      {/* Tax */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Tax</h2>
        <div className="flex items-center gap-3">
          <Switch
            id="vat_registered"
            checked={!!vatRegistered}
            onCheckedChange={(v) => setValue("vat_registered", v)}
          />
          <Label htmlFor="vat_registered">VAT Registered</Label>
        </div>
        {vatRegistered && (
          <div className="space-y-1.5">
            <Label htmlFor="vat_number">VAT Number</Label>
            <Input id="vat_number" {...register("vat_number")} placeholder="GB123456789" />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save Changes" : "Add Contractor"}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
