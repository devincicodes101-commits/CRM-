import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { UpdateInvoiceStatusButton } from "./update-status-button";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default async function CommissionInvoicesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!me || !["admin", "user"].includes(me.role)) redirect("/dashboard");

  const { data: invoices } = await supabase
    .from("commission_invoices")
    .select("*")
    .order("created_date", { ascending: false });

  const totalPaid = (invoices ?? [])
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.total_due ?? 0), 0);

  const totalPending = (invoices ?? [])
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((s, i) => s + Number(i.total_due ?? 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Commission Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track and manage sales agent commission payments
          </p>
        </div>
        <a
          href="/commissions"
          className="text-sm px-4 py-2 rounded-md border hover:bg-muted transition-colors"
        >
          ← Commission Dashboard
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            Total Invoices
          </p>
          <p className="text-2xl font-bold mt-1">{invoices?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            Paid Out
          </p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            £{totalPaid.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            Pending Payment
          </p>
          <p className="text-2xl font-bold mt-1 text-orange-500">
            £{totalPending.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        {!invoices?.length ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No commission invoices yet. Go to the{" "}
            <a href="/commissions" className="text-primary hover:underline">
              Commission Dashboard
            </a>{" "}
            to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2 font-medium">Invoice #</th>
                  <th className="text-left px-4 py-2 font-medium">Agent</th>
                  <th className="text-left px-4 py-2 font-medium">Period</th>
                  <th className="text-right px-4 py-2 font-medium">Quotes</th>
                  <th className="text-right px-4 py-2 font-medium">
                    Quote Value
                  </th>
                  <th className="text-right px-4 py-2 font-medium">
                    Commission
                  </th>
                  <th className="text-right px-4 py-2 font-medium">Total Due</th>
                  <th className="text-center px-4 py-2 font-medium">Status</th>
                  {me.role === "admin" && (
                    <th className="text-right px-4 py-2 font-medium">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{inv.sales_agent_name}</p>
                      {inv.sales_agent_email && (
                        <p className="text-xs text-muted-foreground">
                          {inv.sales_agent_email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {inv.period_start
                        ? format(new Date(inv.period_start), "d MMM")
                        : "—"}{" "}
                      –{" "}
                      {inv.period_end
                        ? format(new Date(inv.period_end), "d MMM yyyy")
                        : "—"}
                    </td>
                    <td className="text-right px-4 py-3">{inv.total_quotes}</td>
                    <td className="text-right px-4 py-3">
                      £{Number(inv.total_quote_value).toFixed(2)}
                    </td>
                    <td className="text-right px-4 py-3 text-green-600 font-medium">
                      £{Number(inv.commission_amount).toFixed(2)}
                    </td>
                    <td className="text-right px-4 py-3 font-bold">
                      £{Number(inv.total_due).toFixed(2)}
                    </td>
                    <td className="text-center px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[inv.status] ?? ""}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    {me.role === "admin" && (
                      <td className="text-right px-4 py-3">
                        <UpdateInvoiceStatusButton
                          invoiceId={inv.id}
                          currentStatus={inv.status}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
