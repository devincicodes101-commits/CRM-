import { createClient } from "@/lib/supabase/server";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import type { Customer } from "@/lib/schemas/customers";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, email, address, city, postcode")
    .order("name")
    .returns<Customer[]>();

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">New Invoice</h1>
        <p className="text-sm text-muted-foreground">Create a new invoice</p>
      </div>
      <InvoiceForm customers={customers ?? []} />
    </div>
  );
}
