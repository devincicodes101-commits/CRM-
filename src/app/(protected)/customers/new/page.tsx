import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CustomerForm } from "@/components/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Customers
        </Link>
        <h1 className="text-2xl font-bold">New Customer</h1>
      </div>
      <CustomerForm />
    </div>
  );
}