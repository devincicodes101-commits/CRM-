import Image from "next/image";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ReceiptDecideButtons } from "./decide-buttons";

const STATUS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

type Row = {
  id: string; operative_name: string; photo_url: string; amount_gbp: number | null;
  item_description: string | null; status: string; created_date: string;
  jobs: { title: string | null } | null;
};

export default async function ReceiptsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single<{ role: string }>();
  if (!me || !["admin", "user"].includes(me.role)) redirect("/dashboard");

  const { data: receipts } = await supabase
    .from("receipts")
    .select("id, operative_name, photo_url, amount_gbp, item_description, status, created_date, jobs(title)")
    .order("created_date", { ascending: false })
    .returns<Row[]>();

  const rows = receipts ?? [];
  const pending = rows.filter((r) => r.status === "pending").length;
  const approvedTotal = rows.filter((r) => r.status === "approved").reduce((s, r) => s + Number(r.amount_gbp ?? 0), 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="size-6 text-emerald-500" /> Expense Receipts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {pending} awaiting approval · £{approvedTotal.toFixed(2)} approved to date.
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">No receipts submitted yet.</p>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-4 px-4 py-3">
                <a href={r.photo_url} target="_blank" rel="noreferrer" className="shrink-0">
                  <Image src={r.photo_url} alt="Receipt" width={56} height={56} unoptimized className="size-14 rounded-lg object-cover border" />
                </a>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {r.amount_gbp != null ? `£${Number(r.amount_gbp).toFixed(2)}` : "No amount"}
                    {r.item_description ? ` · ${r.item_description}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.operative_name}{r.jobs?.title ? ` · ${r.jobs.title}` : ""} · {format(new Date(r.created_date), "d MMM")}
                  </p>
                </div>
                {r.status === "pending" ? (
                  <ReceiptDecideButtons id={r.id} />
                ) : (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${STATUS[r.status] ?? ""}`}>{r.status}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
