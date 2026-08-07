"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { decideReceipt } from "./actions";
import { Button } from "@/components/ui/button";

export function ReceiptDecideButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function decide(d: "approved" | "rejected") {
    start(async () => {
      const r = await decideReceipt(id, d);
      if ("error" in r) toast.error(r.error);
      else toast.success(d === "approved" ? "Receipt approved" : "Receipt rejected");
    });
  }
  return (
    <div className="flex gap-2 shrink-0">
      <Button size="xs" disabled={pending} onClick={() => decide("approved")}>Approve</Button>
      <Button size="xs" variant="outline" disabled={pending} onClick={() => decide("rejected")}>Reject</Button>
    </div>
  );
}
