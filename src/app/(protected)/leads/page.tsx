import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadPipeline } from "@/components/leads/lead-pipeline";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Lead } from "@/lib/schemas/leads";

const PRIORITY_VARIANT = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
} as const;

type View = "list" | "pipeline";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const currentView: View = view === "pipeline" ? "pipeline" : "list";

  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_date", { ascending: false })
    .returns<Lead[]>();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">{leads?.length ?? 0} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden text-sm">
            <Link
              href="/leads?view=list"
              className={`px-3 py-1.5 transition-colors ${
                currentView === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              List
            </Link>
            <Link
              href="/leads?view=pipeline"
              className={`px-3 py-1.5 transition-colors ${
                currentView === "pipeline" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              Pipeline
            </Link>
          </div>
          <Link href="/leads/new" className={cn(buttonVariants())}>
            <Plus className="size-4" /> New Lead
          </Link>
        </div>
      </div>

      {currentView === "pipeline" ? (
        <LeadPipeline leads={leads ?? []} />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Service Interest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Est. Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!leads?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No leads yet.{" "}
                    <Link href="/leads/new" className="text-primary underline">
                      Add one
                    </Link>
                    .
                  </TableCell>
                </TableRow>
              )}
              {leads?.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Link href={`/leads/${l.id}`} className="font-medium hover:underline">
                      {l.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {l.source?.replace("_", " ") ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {l.service_interest ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {l.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={PRIORITY_VARIANT[l.priority ?? "medium"]} className="text-xs">
                      {l.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {l.estimated_value != null
                      ? `£${Number(l.estimated_value).toLocaleString()}`
                      : "—"}
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