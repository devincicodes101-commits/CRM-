import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "@/components/jobs/job-form";
import type { Job } from "@/lib/schemas/jobs";
import type { Customer } from "@/lib/schemas/customers";
import type { Quote } from "@/lib/schemas/quotes";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: job }, { data: customers }, { data: quotes }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", id).single<Job>(),
    supabase.from("customers").select("*").order("name").returns<Customer[]>(),
    supabase
      .from("quotes")
      .select("id, quote_number, customer_name")
      .in("status", ["accepted", "sent"])
      .order("created_date", { ascending: false })
      .returns<Pick<Quote, "id" | "quote_number" | "customer_name">[]>(),
  ]);

  if (!job) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/jobs/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> {job.title}
        </Link>
        <h1 className="text-2xl font-bold">Edit Job</h1>
      </div>
      <JobForm job={job} customers={customers ?? []} quotes={quotes ?? []} />
    </div>
  );
}