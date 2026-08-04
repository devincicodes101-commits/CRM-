"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Receipt, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAndEmailInvoice } from "@/app/(protected)/invoices/actions";

// §8/§10 — one-click white-label invoice + 50% deposit from a booked job.
export function GenerateInvoiceButtons({ jobId }: { jobId: string }) {
  const [pending, start] = useTransition();

  function run(type: "standard" | "deposit") {
    start(async () => {
      const r = await generateAndEmailInvoice(jobId, type);
      if ("error" in r) toast.error(r.error);
      else toast.success(type === "deposit" ? "Deposit invoice sent" : "Invoice generated & sent");
    });
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run("standard")}>
        <Receipt className="size-4" /> Generate Invoice
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run("deposit")}>
        <Percent className="size-4" /> 50% Deposit
      </Button>
    </>
  );
}
