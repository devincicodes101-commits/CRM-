import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LeadForm } from "@/components/leads/lead-form";
import type { Lead } from "@/lib/schemas/leads";

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single<Lead>();

  if (!lead) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/leads/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> {lead.name}
        </Link>
        <h1 className="text-2xl font-bold">Edit Lead</h1>
      </div>
      <LeadForm lead={lead} />
    </div>
  );
}