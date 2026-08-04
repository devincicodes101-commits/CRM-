"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadInvoicePdf } from "@/app/(protected)/invoices/actions";
import type { Invoice } from "@/lib/schemas/invoices";

type Props = { invoice: Invoice };

// Detail-page download — uses the SAME server-side branded generator as the
// emailed / portal / commission PDFs, so every PDF looks identical.
export function InvoicePdfButton({ invoice }: Props) {
  const [pending, start] = useTransition();

  function download() {
    start(async () => {
      const r = await downloadInvoicePdf(invoice.id);
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
    <Button variant="outline" size="sm" disabled={pending} onClick={download}>
      <Download className="size-4" />
      {pending ? "Generating…" : "Download PDF"}
    </Button>
  );
}
