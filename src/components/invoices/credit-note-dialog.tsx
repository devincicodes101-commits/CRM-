"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MinusCircle, X } from "lucide-react";
import { issueCreditNote } from "@/app/(protected)/invoices/actions";

type CustomerOption = { id: string; name: string; email: string | null };

export function CreditNoteDialog({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  function pickCustomer(id: string) {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    if (c) { setName(c.name); setEmail(c.email ?? ""); }
  }

  function submit() {
    start(async () => {
      const res = await issueCreditNote({
        customerId: customerId || null,
        customerName: name,
        customerEmail: email || null,
        amount: parseFloat(amount) || 0,
        reason,
      });
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Credit note issued");
        setOpen(false);
        setCustomerId(""); setName(""); setEmail(""); setAmount(""); setReason("");
        router.push(`/invoices/${res.id}`);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm rounded-xl px-4 py-2 border border-red-300 text-red-600 font-medium hover:bg-red-50 transition-colors"
      >
        <MinusCircle className="size-4" /> Issue Credit Note
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !pending && setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-background border shadow-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <MinusCircle className="size-5" /> Issue Credit Note
              </h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Customer</label>
              <select value={customerId} onChange={(e) => pickCustomer(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm bg-background">
                <option value="">Select a customer…</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Customer Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Or type a name" className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Customer Email <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Credit Amount (£)</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" step="0.01" placeholder="e.g. 150.00" className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reason / Note</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Refund for cancelled service, overcharge correction…" className="w-full rounded-md border px-3 py-2 text-sm resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={submit} disabled={pending} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                <MinusCircle className="size-4" /> {pending ? "Issuing…" : "Issue Credit Note"}
              </button>
              <button onClick={() => setOpen(false)} disabled={pending} className="rounded-xl border px-4 text-sm font-medium hover:bg-muted">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
