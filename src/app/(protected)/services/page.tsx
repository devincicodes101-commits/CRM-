import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Service } from "@/lib/schemas/services";

const UNIT_LABELS: Record<string, string> = {
  per_sqm: "per m²",
  per_lm: "per lm",
  per_hour: "per hr",
  per_day: "per day",
  fixed: "fixed",
  per_unit: "per unit",
};

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("category")
    .order("name")
    .returns<Service[]>();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-sm text-muted-foreground">{services?.length ?? 0} services</p>
        </div>
        <Link href="/services/new" className={cn(buttonVariants())}>
          <Plus className="size-4" /> New Service
        </Link>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Unit Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!services?.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No services yet.{" "}
                  <Link href="/services/new" className="text-primary underline">
                    Add one
                  </Link>
                  .
                </TableCell>
              </TableRow>
            )}
            {services?.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <span className="font-medium">{s.name}</span>
                  {s.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {s.description}
                    </p>
                  )}
                </TableCell>
                <TableCell className="capitalize">{s.category}</TableCell>
                <TableCell>£{Number(s.unit_price).toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {UNIT_LABELS[s.unit_type] ?? s.unit_type}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.estimated_duration ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={s.is_active ? "default" : "outline"}>
                    {s.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/services/${s.id}/edit`}
                    className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}