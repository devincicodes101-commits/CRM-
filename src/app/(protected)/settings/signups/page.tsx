import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DecideButtons } from "./decide-buttons";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

type Row = {
  id: string; operative_name: string; email: string; status: string;
  rejection_reason: string | null; created_date: string;
};

export default async function SignupRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single<{ role: string }>();
  if (!me || me.role !== "admin") redirect("/dashboard");

  const { data: requests } = await supabase
    .from("signup_requests")
    .select("id, operative_name, email, status, rejection_reason, created_date")
    .order("created_date", { ascending: false })
    .returns<Row[]>();

  const rows = requests ?? [];
  const pending = rows.filter((r) => r.status === "pending");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="size-4" /> Settings
        </Link>
        <h1 className="text-2xl font-bold">Signup Requests</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {pending.length} pending · people who requested field-app access via /staff-signup.
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">No signup requests yet.</p>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{r.operative_name}</p>
                  <p className="text-xs text-muted-foreground">{r.email} · {format(new Date(r.created_date), "d MMM yyyy")}</p>
                  {r.rejection_reason && <p className="text-xs text-red-600 mt-0.5">Rejected: {r.rejection_reason}</p>}
                </div>
                {r.status === "pending" ? (
                  <DecideButtons id={r.id} />
                ) : (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[r.status] ?? ""}`}>{r.status}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
