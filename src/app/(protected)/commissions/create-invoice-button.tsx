"use client";

import { useTransition } from "react";
import { createCommissionInvoice } from "./actions";

type Props = {
  agentId: string;
  agentName: string;
  commissionRate: number;
  periodStart: string;
  periodEnd: string;
};

export function CreateCommissionInvoiceButton({
  agentId,
  agentName,
  commissionRate,
  periodStart,
  periodEnd,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createCommissionInvoice({
        agentId,
        agentName,
        commissionRate,
        periodStart,
        periodEnd,
      });
      if (result?.error) {
        alert(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
    >
      {isPending ? "Creating…" : "Create Invoice"}
    </button>
  );
}
