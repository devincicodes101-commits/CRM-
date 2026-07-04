import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Contractor, Subcontractor } from "@/lib/schemas/contractors";

const SUB_STATUS_VARIANT = {
  pending: "secondary",
  active: "default",
  inactive: "outline",
} as const;

type Tab = "contractors" | "subcontractors";

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const currentTab: Tab = tab === "subcontractors" ? "subcontractors" : "contractors";

  const supabase = await createClient();

  const [{ data: contractors }, { data: subcontractors }] = await Promise.all([
    supabase.from("contractors").select("*").order("contact_name").returns<Contractor[]>(),
    supabase.from("subcontractors").select("*").order("name").returns<Subcontractor[]>(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contractors</h1>
          <p className="text-sm text-muted-foreground">
            {currentTab === "contractors"
              ? `${contractors?.length ?? 0} contractors`
              : `${subcontractors?.length ?? 0} subcontractors`}
          </p>
        </div>
        <Link
          href={currentTab === "contractors" ? "/contractors/new" : "/contractors/subcontractors/new"}
          className={cn(buttonVariants())}
        >
          <Plus className="size-4" />
          {currentTab === "contractors" ? "New Contractor" : "New Subcontractor"}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["contractors", "subcontractors"] as const).map((t) => (
          <Link
            key={t}
            href={`/contractors?tab=${t}`}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors",
              currentTab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </Link>
        ))}
      </div>

      {currentTab === "contractors" && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>VAT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!contractors?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    No contractors yet.{" "}
                    <Link href="/contractors/new" className="text-primary underline">Add one</Link>.
                  </TableCell>
                </TableRow>
              )}
              {contractors?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/contractors/${c.id}`} className="font-medium hover:underline">
                      {c.contact_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.company_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                  <TableCell>
                    {c.vat_registered ? (
                      <Badge variant="outline" className="text-xs">VAT</Badge>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {currentTab === "subcontractors" && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!subcontractors?.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No subcontractors yet.{" "}
                    <Link href="/contractors/subcontractors/new" className="text-primary underline">
                      Add one
                    </Link>.
                  </TableCell>
                </TableRow>
              )}
              {subcontractors?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link
                      href={`/contractors/subcontractors/${s.id}`}
                      className="font-medium hover:underline"
                    >
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.company_name ?? "—"}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                    {s.service_categories?.join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.starting_postcode ?? "—"}
                    {s.max_radius_miles ? ` · ${s.max_radius_miles}mi` : ""}
                  </TableCell>
                  <TableCell>
                    {s.rating > 0 ? `${s.rating}/5` : "—"}
                  </TableCell>
                  <TableCell>{s.completed_jobs}</TableCell>
                  <TableCell>
                    <Badge
                      variant={SUB_STATUS_VARIANT[s.status as keyof typeof SUB_STATUS_VARIANT] ?? "outline"}
                      className="text-xs capitalize"
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}