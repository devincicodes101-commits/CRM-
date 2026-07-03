import Link from "next/link";
import { Plus } from "lucide-react";
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
import type { Customer } from "@/lib/schemas/customers";

const STATUS_VARIANT = {
  lead: "secondary",
  active: "default",
  inactive: "outline",
} as const;

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("created_date", { ascending: false })
    .returns<Customer[]>();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers?.length ?? 0} total</p>
        </div>
        <Link href="/customers/new" className={cn(buttonVariants())}>
          <Plus className="size-4" />
          New Customer
        </Link>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!customers?.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No customers yet.{" "}
                  <Link href="/customers/new" className="text-primary underline">
                    Add one
                  </Link>
                  .
                </TableCell>
              </TableRow>
            )}
            {customers?.map((c) => (
              <TableRow key={c.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.company ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                <TableCell>
                  <span className="capitalize">{c.client_type}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[c.status] ?? "outline"}>{c.status}</Badge>
                </TableCell>
                <TableCell>£{(c.total_spent ?? 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}