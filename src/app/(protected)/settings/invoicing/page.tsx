import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { InvoiceModeToggle } from "./invoice-mode-toggle";

export default async function InvoicingSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_settings")
    .select("invoice_mode")
    .limit(1)
    .maybeSingle<{ invoice_mode: string | null }>();

  const initial = data?.invoice_mode === "white_label" ? "white_label" : "company_direct";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="size-4" /> Settings
        </Link>
        <h1 className="text-2xl font-bold">Invoicing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Choose how customers are invoiced when a contractor is assigned.</p>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Invoice the customer as</h2>
        <InvoiceModeToggle initial={initial} />
      </div>
    </div>
  );
}
