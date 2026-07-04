"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { completeJobFromField } from "@/app/(protected)/field/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Props = { jobId: string };

export function JobCompletionForm({ jobId }: Props) {
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleComplete() {
    startTransition(async () => {
      const result = await completeJobFromField(jobId, notes);
      if (result?.error) toast.error(result.error);
      else toast.success("Job marked as complete");
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="completion-notes">Completion Notes (optional)</Label>
        <Textarea
          id="completion-notes"
          placeholder="Any issues, additional work done, or notes for the office…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-sm">I confirm all checklist items are complete and the job is finished</span>
      </label>
      <Button
        onClick={handleComplete}
        disabled={!confirmed || pending}
        className="w-full"
      >
        <CheckCircle className="size-4" />
        {pending ? "Completing…" : "Mark Job Complete"}
      </Button>
    </div>
  );
}