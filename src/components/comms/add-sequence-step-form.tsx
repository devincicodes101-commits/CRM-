"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { createSequenceStep } from "@/app/(protected)/comms/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EmailSequence } from "@/lib/schemas/comms";

type Props = {
  sequenceType: EmailSequence["sequence_type"];
  nextStep: number;
};

export function AddSequenceStepForm({ sequenceType, nextStep }: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delayDays, setDelayDays] = useState(1);
  const [label, setLabel] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setSubject(""); setBody(""); setDelayDays(1); setLabel(""); setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    startTransition(async () => {
      const result = await createSequenceStep({
        sequence_type: sequenceType,
        step: nextStep,
        delay_days: delayDays,
        subject: subject.trim(),
        body: body.trim(),
        label: label.trim() || undefined,
        is_active: true,
      });
      if (result?.error) toast.error(result.error);
      else { toast.success("Step added"); reset(); }
    });
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-xs h-7"
      >
        <Plus className="size-3.5" /> Add Step
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Label (optional)</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={`Step ${nextStep}`}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Delay (days after trigger)</Label>
          <Input
            type="number"
            min={0}
            value={delayDays}
            onChange={(e) => setDelayDays(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Subject *</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Following up on your enquiry"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Body * (use {"{name}"} as variable)</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder={`Hi {name},\n\nWe wanted to follow up on your recent enquiry…`}
          className="text-sm resize-none"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add Step"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={reset}>
          Cancel
        </Button>
      </div>
    </form>
  );
}