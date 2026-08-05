"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { setContractorSuspension } from "@/app/(protected)/contractors/actions";
import { Button } from "@/components/ui/button";

// §5 — suspension banner + lift-suspension control on the contractor page.
export function SuspensionControl({
  contractorId,
  suspended,
  reason,
}: {
  contractorId: string;
  suspended: boolean;
  reason: string | null;
}) {
  const [pending, start] = useTransition();

  function toggle(next: boolean) {
    start(async () => {
      const r = await setContractorSuspension(contractorId, next);
      if ("error" in r) toast.error(r.error);
      else toast.success(next ? "Contractor suspended" : "Suspension lifted");
    });
  }

  if (!suspended) {
    return (
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => toggle(true)}>
        Suspend
      </Button>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 text-sm w-full">
      <AlertTriangle className="size-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-800 dark:text-red-200 font-medium">This contractor is suspended.</p>
        {reason && <p className="text-red-700/80 dark:text-red-300/80 text-xs mt-0.5">{reason}</p>}
        <p className="text-red-700/80 dark:text-red-300/80 text-xs">They can&apos;t be assigned or invited to new jobs.</p>
      </div>
      <Button type="button" size="sm" disabled={pending} onClick={() => toggle(false)}>
        Lift Suspension
      </Button>
    </div>
  );
}
