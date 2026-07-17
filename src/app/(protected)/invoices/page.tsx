import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Invoice } from "@/lib/schemas/invoices";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  part_paid: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-400",
};

const STATUSES = ["all", "draft", "sent", "part_paid", "paid", "overdue", "cancelled"] as const;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const currentStatus = status ?? "all";

  const supabase = await createClient();
  let query = supabase.from("invoices").select("*").order("created_date", { ascending: false });
  if (currentStatus !== "all") query = query.eq("status", currentStatus);
  if (q) query = query.ilike("customer_name", `%${q}%`);

  const { data: invoices } = await query.returns<Invoice[]>();
  const list = invoices ?? [];

  const totalPaid = list.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
  const totalOutstanding = list.filter((i) => !["paid", "cancelled"].includes(i.status)).reduce((s, i) => s + (Number(i.total) - Number(i.amount_paid)), 0);
  const totalOverdue = list.filter((i) => i.status === "overdue").length;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {list.length} invoices · {totalOverdue > 0 ? `${totalOverdue} overdue` : "0 overdue"}
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-1.5 text-sm rounded-xl px-4 py-2 bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          Issue Credit Note
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white shadow-sm p-5">
          <p className="text-sm text-muted-foreground">Total Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">£{totalPaid.toLocaleString("en-GB", { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="rounded-2xl border bg-white shadow-sm p-5">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">£{totalOutstanding.toLocaleString("en-GB", { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="rounded-2xl border bg-white shadow-sm p-5">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{totalOverdue}</p>
        </div>
      </div>

      {/* Search + filter tabs */}
      <div className="space-y-3">
        <form className="relative w-full max-w-sm">
          <svg className="absolute left-3 top-2.5 size-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by customer name or invoice number…"
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/invoices?status=${s}${q ? `&q=${q}` : ""}`}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors capitalize ${
                currentStatus === s
                  ? "bg-primary text-white border-primary"
                  : "hover:bg-muted border-border"
              }`}
            >
              {s.replace("_", " ")}
            </Link>
          ))}
        </div>
      </div>

      {/* Invoice rows */}
      <div className="space-y-3">
        {list.length === 0 && (
          <div className="rounded-2xl border bg-white shadow-sm p-16 text-center">
            <p className="text-muted-foreground">No invoices found.</p>
            <Link href="/invoices/new" className="text-sm text-primary font-medium hover:underline mt-2 block">
              Create your first invoice
            </Link>
          </div>
        )}
        {list.map((inv) => (
          <div key={inv.id} className="rounded-2xl border bg-white shadow-sm p-4 flex items-center gap-4">
            {/* Icon */}
            <div className="shrink-0 w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center">
              <svg className="size-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{inv.customer_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {inv.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                INV-{inv.invoice_number}
                {inv.due_date && ` · Due ${new Date(inv.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                {inv.created_date && ` · Sent ${new Date(inv.created_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
              </p>
            </div>

            {/* Amount */}
            <div className="shrink-0 text-right mr-2">
              <p className="font-bold">£{Number(inv.total).toLocaleString()}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href={`/invoices/${inv.id}`}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border hover:bg-muted transition-colors font-medium"
              >
                View
              </Link>
              {inv.status !== "paid" && (
                <button className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition-colors font-medium">
                  Mark Paid
                </button>
              )}
              {inv.status === "sent" && (
                <button className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors font-medium">
                  Overdue
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
