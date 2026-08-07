"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Receipt, Loader2 } from "lucide-react";
import { uploadReceipt } from "@/app/(protected)/field/jobs/[id]/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// §12 — field expense receipt: snap the receipt, add amount + what it was for.
export function ReceiptUpload({ jobId }: { jobId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pending, start] = useTransition();

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("photo", file);
    fd.append("amount", amount);
    fd.append("description", description);
    start(async () => {
      const res = await uploadReceipt(jobId, fd);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Receipt submitted for approval");
        setAmount(""); setDescription("");
        router.refresh();
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Amount (£)</Label>
          <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">What for?</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Materials, fuel…" />
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/5 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Receipt className="size-4" />}
        {pending ? "Uploading…" : "Snap Receipt"}
      </button>
    </div>
  );
}
