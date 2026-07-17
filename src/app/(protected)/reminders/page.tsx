import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, isPast, isToday } from "date-fns";
import { Bell, FileText, Receipt, Briefcase } from "lucide-react";
import Link from "next/link";

function DeadlineBadge({ date }: { date: string }) {
  const d = new Date(date);
  const overdue = isPast(d) && !isToday(d);
  const today = isToday(d);
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
      overdue ? "bg-red-100 text-red-700" : today ? "bg-orange-100 text-orange-700" : "bg-blue-50 text-blue-700"
    }`}>
      {overdue ? "Overdue" : today ? "Today" : format(d, "d MMM")}
    </span>
  );
}

export default async function RemindersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date().toISOString();

  const [quotesRes, invoicesRes, jobsRes] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, quote_number, customer_name, total, reminder_date, reminder_note")
      .eq("reminder_done", false)
      .not("reminder_date", "is", null)
      .order("reminder_date"),
    supabase
      .from("invoices")
      .select("id, invoice_number, customer_name, total, due_date, status")
      .in("status", ["sent", "overdue", "part_paid"])
      .order("due_date"),
    supabase
      .from("jobs")
      .select("id, title, customer_name, start_date, status")
      .in("status", ["scheduled"])
      .gte("start_date", now)
      .order("start_date")
      .limit(20),
  ]);

  const quoteReminders = quotesRes.data ?? [];
  const invoiceFollowUps = invoicesRes.data ?? [];
  const upcomingJobs = jobsRes.data ?? [];

  const totalCount = quoteReminders.length + invoiceFollowUps.length + upcomingJobs.length;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reminders & Follow-ups</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalCount} item{totalCount !== 1 ? "s" : ""} need attention
          </p>
        </div>
      </div>

      {/* Quote reminders */}
      <Section
        icon={<FileText className="h-4 w-4 text-blue-600" />}
        title="Quote Follow-ups"
        count={quoteReminders.length}
        color="blue"
      >
        {quoteReminders.length === 0 ? (
          <Empty text="No quote reminders set." />
        ) : quoteReminders.map((q) => (
          <Row
            key={q.id}
            href={`/quotes/${q.id}`}
            primary={q.customer_name}
            secondary={`${q.quote_number} · £${Number(q.total ?? 0).toFixed(2)}`}
            note={q.reminder_note}
            badge={q.reminder_date ? <DeadlineBadge date={q.reminder_date} /> : null}
          />
        ))}
      </Section>

      {/* Invoice follow-ups */}
      <Section
        icon={<Receipt className="h-4 w-4 text-orange-600" />}
        title="Unpaid Invoices"
        count={invoiceFollowUps.length}
        color="orange"
      >
        {invoiceFollowUps.length === 0 ? (
          <Empty text="All invoices are up to date." />
        ) : invoiceFollowUps.map((i) => (
          <Row
            key={i.id}
            href={`/invoices/${i.id}`}
            primary={i.customer_name}
            secondary={`${i.invoice_number} · £${Number(i.total ?? 0).toFixed(2)}`}
            badge={
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                  i.status === "overdue" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                }`}>{i.status.replace("_", " ")}</span>
                {i.due_date && <DeadlineBadge date={i.due_date} />}
              </div>
            }
          />
        ))}
      </Section>

      {/* Upcoming jobs */}
      <Section
        icon={<Briefcase className="h-4 w-4 text-purple-600" />}
        title="Upcoming Jobs"
        count={upcomingJobs.length}
        color="purple"
      >
        {upcomingJobs.length === 0 ? (
          <Empty text="No upcoming scheduled jobs." />
        ) : upcomingJobs.map((j) => (
          <Row
            key={j.id}
            href={`/jobs/${j.id}`}
            primary={j.title}
            secondary={j.customer_name ?? "No customer"}
            badge={j.start_date ? <DeadlineBadge date={j.start_date} /> : null}
          />
        ))}
      </Section>
    </div>
  );
}

function Section({ icon, title, count, color, children }: {
  icon: React.ReactNode;
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
}) {
  const borderMap: Record<string, string> = { blue: "border-l-blue-400", orange: "border-l-orange-400", purple: "border-l-purple-400" };
  const badgeMap: Record<string, string> = { blue: "bg-blue-100 text-blue-700", orange: "bg-orange-100 text-orange-700", purple: "bg-purple-100 text-purple-700" };
  return (
    <div className={`rounded-2xl border border-l-4 ${borderMap[color] ?? ""} bg-white shadow-sm overflow-hidden`}>
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeMap[color] ?? ""}`}>
          {count}
        </span>
      </div>
      <div className="divide-y">{children}</div>
    </div>
  );
}

function Row({ href, primary, secondary, badge, note }: {
  href: string;
  primary: string;
  secondary: string;
  badge?: React.ReactNode;
  note?: string | null;
}) {
  return (
    <Link href={href} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
      <div>
        <p className="text-sm font-medium">{primary}</p>
        <p className="text-xs text-muted-foreground">{secondary}</p>
        {note && <p className="text-xs text-muted-foreground italic mt-0.5">{note}</p>}
      </div>
      {badge && <div className="shrink-0 ml-3">{badge}</div>}
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-5 py-4 text-sm text-muted-foreground">{text}</p>;
}
