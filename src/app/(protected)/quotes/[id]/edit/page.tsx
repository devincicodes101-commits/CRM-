import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuoteBuilder } from "@/components/quotes/quote-builder";
import type { Quote } from "@/lib/schemas/quotes";
import type { Customer } from "@/lib/schemas/customers";
import type { Service } from "@/lib/schemas/services";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quote }, { data: customers }, { data: services }] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).single<Quote>(),
    supabase.from("customers").select("*").eq("status", "active").order("name").returns<Customer[]>(),
    supabase.from("services").select("*").eq("is_active", true).order("name").returns<Service[]>(),
  ]);

  if (!quote) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/quotes/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Quote #{quote.quote_number}
        </Link>
        <h1 className="text-2xl font-bold">Edit Quote</h1>
      </div>
      <QuoteBuilder quote={quote} customers={customers ?? []} services={services ?? []} />
    </div>
  );
}
