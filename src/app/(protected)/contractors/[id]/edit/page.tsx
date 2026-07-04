import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContractorForm } from "@/components/contractors/contractor-form";
import type { Contractor } from "@/lib/schemas/contractors";

export default async function EditContractorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: contractor } = await supabase
    .from("contractors")
    .select("*")
    .eq("id", id)
    .single<Contractor>();

  if (!contractor) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Edit Contractor</h1>
        <p className="text-sm text-muted-foreground">{contractor.contact_name}</p>
      </div>
      <ContractorForm contractor={contractor} />
    </div>
  );
}