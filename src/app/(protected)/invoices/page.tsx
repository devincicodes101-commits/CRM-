import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Invoice } from "@/lib/schemas/invoices";

const STATUS_VARIANT = {
  draft: "outline",
  sent: "secondary",
  part_paid: "secondary",
  paid: "default",
  overdue: "destructive",
  cancelled: "outline",
} as const;

const STATUSES = ["all", "draft", "sent", "part_paid", "paid", "overdue", "cancelled"] as const;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const currentStatus = status ?? "all";

  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select("*")
    .order("created_date", { ascending: false });

  if (currentStatus !== "all") {
    query = query.eq("status", currentStatus);
  }

  const { data: invoices } = await query.returns<Invoice[]>();

  const totalOutstanding = invoices
    ?.filter((i) => !["paid", "cancelled"].includes(i.status))
    .reduce((sum, i) => sum + (Number(i.total) - Number(i.amount_paid)), 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            {invoices?.length ?? 0} invoices
            {totalOutstanding > 0 && (
              <span className="ml-2 text-destructive font-medium">
                · £{totalOutstanding.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding
              </span>
            )}
          </p>
        </div>
        <Link href="/invoices/new" className={cn(buttonVariants())}>
          <Plus className="size-4" /> New Invoice
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/invoices?status=${s}`}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize",
              currentStatus === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            )}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!invoices?.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  No invoices found.{" "}
                  <Link href="/invoices/new" className="text-primary underline">
                    Create one
                  </Link>
                  .
                </TableCell>
              </TableRow>
            )}
            {invoices?.map((inv) => {
              const balance = Number(inv.total) - Number(inv.amount_paid);
              return (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline font-mono text-sm">
                      #{inv.invoice_number}
                    </Link>
                  </TableCell>
                  <TableCell>{inv.customer_name}</TableCell>
                  <TableCell className="capitalize text-muted-foreground text-sm">
                    {inv.invoice_type?.replace("_", " ") ?? "standard"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(inv.created_date).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {inv.due_date
                      ? new Date(inv.due_date).toLocaleDateString("en-GB")
                      : "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    £{Number(inv.total).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {Number(inv.amount_paid) > 0 ? (
                      <span className={balance <= 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                        £{Number(inv.amount_paid).toFixed(2)}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[inv.status as keyof typeof STATUS_VARIANT] ?? "outline"}
                      className="capitalize text-xs"
                    >
                      {inv.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
