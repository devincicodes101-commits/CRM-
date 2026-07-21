import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, Trash2, Building2, Phone, Mail, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AsyncButton } from "@/components/ui/async-button";
import { deleteContractor } from "@/app/(protected)/contractors/actions";
import type { Contractor } from "@/lib/schemas/contractors";

export default async function ContractorDetailPage({
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

  const fullAddress = [
    contractor.address_line1,
    contractor.address_line2,
    contractor.address_city,
    contractor.address_postcode,
  ].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/contractors"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="size-4" /> Contractors
          </Link>
          <h1 className="text-2xl font-bold">{contractor.contact_name}</h1>
          {contractor.company_name && (
            <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
              <Building2 className="size-4" /> {contractor.company_name}
            </p>
          )}
          {contractor.vat_registered && (
            <Badge variant="outline" className="mt-1.5 text-xs">VAT Registered</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/contractors/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Pencil className="size-4" /> Edit
          </Link>
          <AsyncButton action={deleteContractor.bind(null, id)} variant="outline" size="sm">
            <Trash2 className="size-4" /> Delete
          </AsyncButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground shrink-0" />
              <a href={`mailto:${contractor.email}`} className="text-primary hover:underline">
                {contractor.email}
              </a>
            </div>
            {contractor.phone && (
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground shrink-0" />
                <a href={`tel:${contractor.phone}`} className="hover:underline">
                  {contractor.phone}
                </a>
              </div>
            )}
            {fullAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{fullAddress}</span>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Bank Details</h2>
          <dl className="space-y-2 text-sm">
            {contractor.bank_account_name && (
              <Row label="Account" value={contractor.bank_account_name} />
            )}
            {contractor.bank_sort_code && (
              <Row label="Sort Code" value={contractor.bank_sort_code} />
            )}
            {contractor.bank_account_number && (
              <Row label="Acc No." value={contractor.bank_account_number} />
            )}
            {contractor.vat_number && (
              <Row label="VAT No." value={contractor.vat_number} />
            )}
            {!contractor.bank_account_name && !contractor.bank_sort_code && (
              <p className="text-muted-foreground text-sm">No bank details on file.</p>
            )}
          </dl>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Registration</h2>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              contractor.registration_completed ? "bg-green-500" : "bg-yellow-500"
            )}
          />
          <span className="text-sm">
            {contractor.registration_completed ? "Registration complete" : "Registration incomplete"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}