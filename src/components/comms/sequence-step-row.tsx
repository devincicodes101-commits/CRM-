"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { updateSequenceStep, deleteSequenceStep, toggleSequenceStep } from "@/app/(protected)/comms/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { EmailSequence } from "@/lib/schemas/comms";

export function SequenceStepRow({ step }: { step: EmailSequence }) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(step.subject);
  const [body, setBody] = useState(step.body);
  const [delayDays, setDelayDays] = useState(step.delay_days);
  const [label, setLabel] = useState(step.label ?? "");
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateSequenceStep(step.id, {
        subject,
        body,
        delay_days: delayDays,
        label: label || undefined,
      });
      if (result?.error) toast.error(result.error);
      else { toast.success("Step updated"); setEditing(false); }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSequenceStep(step.id);
      if (result?.error) toast.error(result.error);
      else toast.success("Step deleted");
    });
  }

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleSequenceStep(step.id, checked);
      if (result?.error) toast.error(result.error);
    });
  }

  if (editing) {
    return (
      <div className="px-4 py-4 space-y-3 bg-muted/20">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Follow-up #1"
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
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Body * (use {"{name}"}, {"{company}"} as variables)</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="text-sm resize-none font-mono text-xs"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={pending}>
            <Check className="size-3.5" /> Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
            <X className="size-3.5" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="size-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
          {step.step}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {step.label ?? `Step ${step.step}`}
            <span className="text-xs text-muted-foreground ml-2">
              Day {step.delay_days}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">{step.subject}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[400px]">{step.body}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Switch
          checked={step.is_active}
          onCheckedChange={handleToggle}
        />
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setEditing(true)}
          disabled={pending}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={handleDelete}
          disabled={pending}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}