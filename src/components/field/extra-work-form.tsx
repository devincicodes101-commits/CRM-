"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, HardHat } from "lucide-react";
import { createExtraWorkRequest } from "@/app/(protected)/field/jobs/[id]/actions";

export function ExtraWorkForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      const res = await createExtraWorkRequest(jobId, desc, parseFloat(amount) || 0);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Extra-work request sent to the office");
        setDesc(""); setAmount(""); setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/5 py-2.5 text-sm font-medium text-primary hover:bg-primary/10">
        <Plus className="size-4" /> Request Extra Work
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium"><HardHat className="size-4 text-primary" /> Extra work request</div>
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Describe the additional work needed…" className="w-full rounded-md border px-3 py-2 text-sm resize-none" />
      <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" step="0.01" placeholder="Amount (£)" className="w-full rounded-md border px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button onClick={submit} disabled={pending} className="flex-1 rounded-md bg-primary text-white py-2 text-sm font-medium disabled:opacity-60">{pending ? "Sending…" : "Send request"}</button>
        <button onClick={() => setOpen(false)} disabled={pending} className="rounded-md border px-4 text-sm">Cancel</button>
      </div>
    </div>
  );
}
