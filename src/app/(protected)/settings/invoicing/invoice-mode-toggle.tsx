"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setInvoiceMode } from "../actions";

type Mode = "white_label" | "company_direct";

const OPTIONS: { value: Mode; title: string; desc: string }[] = [
  {
    value: "white_label",
    title: "The contractor (white-label)",
    desc: "Customer invoices use the assigned contractor's branding and bank details. A commission invoice is raised to the contractor.",
  },
  {
    value: "company_direct",
    title: "Our company directly (full value)",
    desc: "Customer invoices always use your company branding and the full job value, regardless of who is assigned. No commission invoice is sent.",
  },
];

export function InvoiceModeToggle({ initial }: { initial: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);
  const [pending, start] = useTransition();

  function choose(next: Mode) {
    if (next === mode) return;
    const prev = mode;
    setMode(next);
    start(async () => {
      const r = await setInvoiceMode(next);
      if ("error" in r) {
        setMode(prev);
        toast.error(r.error);
      } else {
        toast.success("Invoicing mode updated");
      }
    });
  }

  return (
    <div className="space-y-3">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={pending}
          onClick={() => choose(o.value)}
          className={`w-full text-left rounded-xl border p-4 transition-colors ${
            mode === o.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`size-4 rounded-full border-2 shrink-0 ${
                mode === o.value ? "border-primary bg-primary" : "border-muted-foreground"
              }`}
            />
            <span className="font-medium text-sm">{o.title}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 pl-6">{o.desc}</p>
        </button>
      ))}
    </div>
  );
}
