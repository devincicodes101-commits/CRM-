import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "@/components/jobs/job-form";
import type { Customer } from "@/lib/schemas/customers";
import type { Quote } from "@/lib/schemas/quotes";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ quote?: string }>;
}) {
  const { quote: quoteId } = await searchParams;
  const supabase = await createClient();

  const [
    { data: customers },
    { data: quotes },
    { data: services },
    { data: vehicles },
    { data: operatives },
    { data: contractors },
  ] = await Promise.all([
    supabase.from("customers").select("*").order("name").returns<Customer[]>(),
    supabase
      .from("quotes")
      .select("id, quote_number, customer_name")
      .eq("status", "accepted")
      .order("created_date", { ascending: false })
      .returns<Pick<Quote, "id" | "quote_number" | "customer_name">[]>(),
    supabase
      .from("services")
      .select("id, name, category, unit_price, unit_type")
      .eq("is_active", true)
      .order("name")
      .returns<{ id: string; name: string; category: string; unit_price: number; unit_type: string }[]>(),
    supabase
      .from("vehicles")
      .select("id, name, registration")
      .order("name")
      .returns<{ id: string; name: string; registration: string }[]>(),
    supabase
      .from("users")
      .select("id, full_name, role")
      .eq("role", "operative")
      .order("full_name")
      .returns<{ id: string; full_name: string; role: string }[]>(),
    supabase
      .from("contractors")
      .select("id, contact_name, company_name")
      .order("contact_name")
      .returns<{ id: string; contact_name: string; company_name: string | null }[]>(),
  ]);

  // Prefill from an accepted quote when arriving via "Book Job in Diary".
  let prefillQuote = undefined;
  if (quoteId) {
    const { data: q } = await supabase
      .from("quotes")
      .select("id, customer_id, customer_name, customer_email, customer_address, items, total")
      .eq("id", quoteId)
      .maybeSingle<{
        id: string; customer_id: string | null; customer_name: string | null;
        customer_email: string | null; customer_address: string | null;
        items: { service_name: string }[] | null; total: number | null;
      }>();
    if (q) {
      const first = q.items?.[0]?.service_name || "Work";
      prefillQuote = {
        id: q.id,
        customer_id: q.customer_id,
        customer_name: q.customer_name,
        customer_email: q.customer_email,
        customer_address: q.customer_address,
        total: q.total,
        title: `${first} — ${q.customer_name ?? "Customer"}`,
        description: (q.items ?? []).map((i) => i.service_name).join(", "),
      };
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Jobs
        </Link>
        <h1 className="text-2xl font-bold">New Job</h1>
      </div>
      <JobForm
        customers={customers ?? []}
        quotes={quotes ?? []}
        services={services ?? []}
        vehicles={vehicles ?? []}
        operatives={operatives ?? []}
        contractors={contractors ?? []}
        prefillQuote={prefillQuote}
      />
    </div>
  );
}