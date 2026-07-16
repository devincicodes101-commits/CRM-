"use client";

import { useTransition } from "react";
import { updateCommissionInvoiceStatus } from "./actions";

const NEXT_STATUS: Record<string, { label: string; value: "sent" | "paid" | "cancelled" }> = {
  draft: { label: "Mark Sent", value: "sent" },
  sent: { label: "Mark Paid", value: "paid" },
};

export function UpdateInvoiceStatusButton({
  invoiceId,
  currentStatus,
}: {
  invoiceId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const next = NEXT_STATUS[currentStatus];

  if (!next) return null;

  function handleClick() {
    startTransition(async () => {
      const result = await updateCommissionInvoiceStatus(invoiceId, next.value);
      if (result?.error) alert(result.error);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted disabled:opacity-50 transition-colors"
    >
      {isPending ? "Updating…" : next.label}
    </button>
  );
}
