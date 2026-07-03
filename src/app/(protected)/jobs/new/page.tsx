import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "@/components/jobs/job-form";
import type { Customer } from "@/lib/schemas/customers";
import type { Quote } from "@/lib/schemas/quotes";

export default async function NewJobPage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: quotes }] = await Promise.all([
    supabase.from("customers").select("*").order("name").returns<Customer[]>(),
    supabase
      .from("quotes")
      .select("id, quote_number, customer_name")
      .eq("status", "accepted")
      .order("created_date", { ascending: false })
      .returns<Pick<Quote, "id" | "quote_number" | "customer_name">[]>(),
  ]);

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
      <JobForm customers={customers ?? []} quotes={quotes ?? []} />
    </div>
  );
}