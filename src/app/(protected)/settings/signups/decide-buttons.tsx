"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { decideSignupRequest } from "./actions";
import { Button } from "@/components/ui/button";

export function DecideButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();

  function decide(decision: "approved" | "rejected") {
    const reason = decision === "rejected" ? prompt("Reason for rejection (optional):") ?? undefined : undefined;
    start(async () => {
      const r = await decideSignupRequest(id, decision, reason);
      if ("error" in r) toast.error(r.error);
      else toast.success(decision === "approved" ? "Approved — invite queued" : "Rejected");
    });
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button size="xs" disabled={pending} onClick={() => decide("approved")}>Approve</Button>
      <Button size="xs" variant="outline" disabled={pending} onClick={() => decide("rejected")}>Reject</Button>
    </div>
  );
}
