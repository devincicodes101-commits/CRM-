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
import type { Quote } from "@/lib/schemas/quotes";

const STATUS_VARIANT = {
  draft: "outline",
  sent: "secondary",
  accepted: "default",
  declined: "destructive",
  expired: "outline",
} as const;

export default async function QuotesPage() {
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, customer_name, customer_email, total, status, created_date, sent_date")
    .order("created_date", { ascending: false })
    .returns<
      Pick<
        Quote,
        | "id"
        | "quote_number"
        | "customer_name"
        | "customer_email"
        | "total"
        | "status"
        | "created_date"
        | "sent_date"
      >[]
    >();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-sm text-muted-foreground">{quotes?.length ?? 0} total</p>
        </div>
        <Link href="/quotes/new" className={cn(buttonVariants())}>
          <Plus className="size-4" /> New Quote
        </Link>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!quotes?.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No quotes yet.{" "}
                  <Link href="/quotes/new" className="text-primary underline">
                    Create one
                  </Link>
                  .
                </TableCell>
              </TableRow>
            )}
            {quotes?.map((q) => (
              <TableRow key={q.id}>
                <TableCell>
                  <Link href={`/quotes/${q.id}`} className="font-medium text-primary hover:underline">
                    #{q.quote_number}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{q.customer_name}</p>
                    {q.customer_email && (
                      <p className="text-xs text-muted-foreground">{q.customer_email}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">£{Number(q.total).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[q.status] ?? "outline"} className="capitalize">
                    {q.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(q.created_date).toLocaleDateString("en-GB")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {q.sent_date ? new Date(q.sent_date).toLocaleDateString("en-GB") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}