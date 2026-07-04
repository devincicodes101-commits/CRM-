import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubcontractorForm } from "@/components/contractors/subcontractor-form";
import type { Subcontractor } from "@/lib/schemas/contractors";

export default async function EditSubcontractorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("subcontractors")
    .select("*")
    .eq("id", id)
    .single<Subcontractor>();

  if (!sub) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Edit Subcontractor</h1>
        <p className="text-sm text-muted-foreground">{sub.name}</p>
      </div>
      <SubcontractorForm subcontractor={sub} />
    </div>
  );
}