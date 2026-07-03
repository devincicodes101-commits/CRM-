import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuoteBuilder } from "@/components/quotes/quote-builder";
import type { Customer } from "@/lib/schemas/customers";
import type { Service } from "@/lib/schemas/services";

export default async function NewQuotePage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: services }] = await Promise.all([
    supabase.from("customers").select("*").eq("status", "active").order("name").returns<Customer[]>(),
    supabase.from("services").select("*").eq("is_active", true).order("name").returns<Service[]>(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/quotes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Quotes
        </Link>
        <h1 className="text-2xl font-bold">New Quote</h1>
      </div>
      <QuoteBuilder customers={customers ?? []} services={services ?? []} />
    </div>
  );
}