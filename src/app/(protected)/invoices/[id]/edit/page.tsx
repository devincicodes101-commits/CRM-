import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import type { Invoice } from "@/lib/schemas/invoices";
import type { Customer } from "@/lib/schemas/customers";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: customers }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).single<Invoice>(),
    supabase
      .from("customers")
      .select("id, name, email, address, city, postcode")
      .order("name")
      .returns<Customer[]>(),
  ]);

  if (!invoice) notFound();

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Edit Invoice #{invoice.invoice_number}</h1>
        <p className="text-sm text-muted-foreground">Update invoice details</p>
      </div>
      <InvoiceForm invoice={invoice} customers={customers ?? []} />
    </div>
  );
}
