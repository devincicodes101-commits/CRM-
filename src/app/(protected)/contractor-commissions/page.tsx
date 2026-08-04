import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { UpdateStatusButton } from "./update-status-button";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const gbp = (n: number) => `£${Number(n ?? 0).toFixed(2)}`;

export default async function ContractorCommissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single<{ role: string }>();
  if (!me || !["admin", "user"].includes(me.role)) redirect("/dashboard");

  const { data: invoices } = await supabase
    .from("contractor_commission_invoices")
    .select("*")
    .order("created_date", { ascending: false });

  const rows = invoices ?? [];
  const totalPaid = rows.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total_due ?? 0), 0);
  const totalPending = rows.filter((i) => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + Number(i.total_due ?? 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Contractor Commissions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Agency fees owed by contractors on white-label jobs (the company&apos;s share).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Total Invoices</p>
          <p className="text-2xl font-bold mt-1">{rows.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Collected</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{gbp(totalPaid)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Outstanding</p>
          <p className="text-2xl font-bold mt-1 text-orange-500">{gbp(totalPending)}</p>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No contractor commission invoices yet. They are raised automatically when you generate a
            white-label customer invoice on a contractor-assigned job.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2 font-medium">Invoice #</th>
                  <th className="text-left px-4 py-2 font-medium">Contractor</th>
                  <th className="text-left px-4 py-2 font-medium">Job</th>
                  <th className="text-right px-4 py-2 font-medium">Job Value</th>
                  <th className="text-right px-4 py-2 font-medium">Their Share</th>
                  <th className="text-right px-4 py-2 font-medium">Commission Due</th>
                  <th className="text-center px-4 py-2 font-medium">Status</th>
                  {me.role === "admin" && <th className="text-right px-4 py-2 font-medium">Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{inv.contractor_name}</p>
                      {inv.contractor_email && <p className="text-xs text-muted-foreground">{inv.contractor_email}</p>}
                      <p className="text-[11px] text-muted-foreground">{inv.sent_date ? format(new Date(inv.sent_date), "d MMM yyyy") : ""}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.job_title ?? "—"}</td>
                    <td className="text-right px-4 py-3">{gbp(Number(inv.job_value))}</td>
                    <td className="text-right px-4 py-3">{gbp(Number(inv.contractor_pay_amount))}</td>
                    <td className="text-right px-4 py-3 font-bold text-emerald-600">{gbp(Number(inv.commission_amount))}</td>
                    <td className="text-center px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[inv.status] ?? ""}`}>
                        {inv.status}
                      </span>
                    </td>
                    {me.role === "admin" && (
                      <td className="text-right px-4 py-3">
                        <UpdateStatusButton invoiceId={inv.id} currentStatus={inv.status} />
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
