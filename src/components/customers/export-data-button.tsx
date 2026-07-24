"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportCustomerData } from "@/app/(protected)/customers/actions";

// GDPR "right to access" — downloads everything the CRM holds about a customer.
export function ExportDataButton({ customerId, customerName }: { customerId: string; customerName: string }) {
  const [pending, start] = useTransition();

  function run() {
    start(async () => {
      const res = await exportCustomerData(customerId);
      if ("error" in res) { toast.error(res.error); return; }
      const blob = new Blob([res.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${customerName.replace(/\s+/g, "_")}_data_export.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported");
    });
  }

  return (
    <button
      onClick={run}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
      title="Export all data held on this customer (GDPR)"
    >
      <Download className="size-4" /> {pending ? "Exporting…" : "Export Data"}
    </button>
  );
}
