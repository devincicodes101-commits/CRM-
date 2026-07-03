"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { leadInsertSchema } from "@/lib/schemas/leads";
import type { Lead } from "@/lib/schemas/leads";
import { createLead, updateLead } from "@/app/(protected)/leads/actions";
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

type FormValues = z.input<typeof leadInsertSchema>;

type Props = {
  lead?: Lead;
};

export function LeadForm({ lead }: Props) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!lead;

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(leadInsertSchema),
    defaultValues: lead ?? {
      name: "",
      email: "",
      phone: "",
      source: undefined,
      category: undefined,
      service_interest: "",
      message: "",
      address: "",
      status: "new",
      priority: "medium",
      notes: "",
      call_notes: "",
      estimated_value: undefined,
      consent_given: false,
      seq_steps_sent: [],
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateLead(lead.id, values)
        : await createLead(values);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estimated_value">Estimated Value (£)</Label>
          <Input
            id="estimated_value"
            type="number"
            step="0.01"
            {...register("estimated_value", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? "new"} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="appointment_booked">Appointment Booked</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
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
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Source</Label>
          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || undefined)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select source…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="website_form">Website Form</SelectItem>
                  <SelectItem value="google_ads">Google Ads</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="service_interest">Service Interest</Label>
          <Input id="service_interest" {...register("service_interest")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register("address")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="follow_up_date">Follow-up Date</Label>
          <Input
            id="follow_up_date"
            type="datetime-local"
            {...register("follow_up_date")}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" {...register("message")} rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register("notes")} rows={3} />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Lead"}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}