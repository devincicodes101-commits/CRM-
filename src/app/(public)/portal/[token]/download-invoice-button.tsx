"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { downloadInvoice } from "./actions";

// §11 — portal PDF download. Decodes the base64 returned by the server action
// into a Blob and triggers a browser download (no login).
export function DownloadInvoiceButton({ token, invoiceId }: { token: string; invoiceId: string }) {
  const [pending, start] = useTransition();

  function run() {
    start(async () => {
      const r = await downloadInvoice(token, invoiceId);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      const bytes = Uint8Array.from(atob(r.pdf), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = r.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
    >
      <Download className="size-3.5" /> {pending ? "…" : "PDF"}
    </button>
  );
}
