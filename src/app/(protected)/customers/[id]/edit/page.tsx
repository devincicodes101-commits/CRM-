import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CustomerForm } from "@/components/customers/customer-form";
import type { Customer } from "@/lib/schemas/customers";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single<Customer>();

  if (!customer) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/customers/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> {customer.name}
        </Link>
        <h1 className="text-2xl font-bold">Edit Customer</h1>
      </div>
      <CustomerForm customer={customer} />
    </div>
  );
}