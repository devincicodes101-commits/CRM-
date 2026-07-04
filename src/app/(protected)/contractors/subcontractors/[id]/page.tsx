import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, Star, MapPin, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AsyncButton } from "@/components/ui/async-button";
import { toggleSubcontractorStatus, deleteSubcontractor } from "@/app/(protected)/contractors/actions";
import type { Subcontractor } from "@/lib/schemas/contractors";

const STATUS_VARIANT = {
  pending: "secondary",
  active: "default",
  inactive: "outline",
} as const;

export default async function SubcontractorDetailPage({
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/contractors?tab=subcontractors"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="size-4" /> Subcontractors
          </Link>
          <h1 className="text-2xl font-bold">{sub.name}</h1>
          {sub.company_name && (
            <p className="text-muted-foreground text-sm mt-0.5">{sub.company_name}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <Badge
              variant={STATUS_VARIANT[sub.status as keyof typeof STATUS_VARIANT] ?? "outline"}
              className="capitalize"
            >
              {sub.status}
            </Badge>
            {sub.rating > 0 && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                {sub.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AsyncButton
            action={() => toggleSubcontractorStatus(id, sub.status)}
            variant="outline"
            size="sm"
          >
            {sub.status === "active" ? "Deactivate" : "Activate"}
          </AsyncButton>
          <Link
            href={`/contractors/subcontractors/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Pencil className="size-4" /> Edit
          </Link>
          <AsyncButton action={() => deleteSubcontractor(id)} variant="outline" size="sm">
            Delete
          </AsyncButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={sub.email} />
            {sub.phone && <Row label="Phone" value={sub.phone} />}
          </dl>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Stats</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-muted-foreground" />
              <span>{sub.completed_jobs} completed job{sub.completed_jobs !== 1 ? "s" : ""}</span>
            </div>
            {(sub.starting_postcode || sub.max_radius_miles) && (
              <div className="flex items-start gap-2">
                <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>
                  {sub.starting_postcode ?? ""}
                  {sub.max_radius_miles ? ` · up to ${sub.max_radius_miles} miles` : ""}
                </span>
              </div>
            )}
          </dl>
        </div>
      </div>

      {sub.service_categories && sub.service_categories.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Services</h2>
          <div className="flex flex-wrap gap-2">
            {sub.service_categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
            ))}
          </div>
        </div>
      )}

      {sub.covered_areas && sub.covered_areas.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Covered Areas</h2>
          <div className="flex flex-wrap gap-2">
            {sub.covered_areas.map((area) => (
              <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
            ))}
          </div>
        </div>
      )}

      {sub.notes && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{sub.notes}</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}