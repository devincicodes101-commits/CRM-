"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { completeOnboarding, type OnboardingValues } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { contractorInsertSchema } from "@/lib/schemas/contractors";

const onboardingSchema = contractorInsertSchema.omit({
  user_id: true,
  registration_completed: true,
});

export function OnboardingForm({
  defaultValues,
}: {
  defaultValues: OnboardingValues;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues,
  });

  const vatRegistered = watch("vat_registered");

  function onSubmit(values: OnboardingValues) {
    startTransition(async () => {
      const result = await completeOnboarding(values);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete your contractor profile</CardTitle>
        <CardDescription>
          We need a few details before you can be assigned jobs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact_name">Contact name</Label>
              <Input id="contact_name" {...register("contact_name")} />
              {errors.contact_name && (
                <p className="text-xs text-destructive">{errors.contact_name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company name</Label>
              <Input id="company_name" {...register("company_name")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address_line1">Address line 1</Label>
            <Input id="address_line1" {...register("address_line1")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address_line2">Address line 2</Label>
            <Input id="address_line2" {...register("address_line2")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="address_city">City</Label>
              <Input id="address_city" {...register("address_city")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address_postcode">Postcode</Label>
              <Input id="address_postcode" {...register("address_postcode")} />
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <p className="text-sm font-medium">Bank details</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bank_account_name">Account name</Label>
                <Input id="bank_account_name" {...register("bank_account_name")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bank_sort_code">Sort code</Label>
                <Input id="bank_sort_code" {...register("bank_sort_code")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank_account_number">Account number</Label>
              <Input id="bank_account_number" {...register("bank_account_number")} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="vat_registered"
              checked={vatRegistered}
              onCheckedChange={(checked) => setValue("vat_registered", checked)}
            />
            <Label htmlFor="vat_registered">VAT registered</Label>
          </div>
          {vatRegistered && (
            <div className="space-y-1.5">
              <Label htmlFor="vat_number">VAT number</Label>
              <Input id="vat_number" {...register("vat_number")} />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving..." : "Complete profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
