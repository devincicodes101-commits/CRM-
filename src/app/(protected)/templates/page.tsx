import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Mail, FileText, LayoutTemplate } from "lucide-react";

const TEMPLATE_PREVIEWS = [
  {
    id: "modern",
    label: "Modern",
    description: "Clean layout with bold headings and a colored accent bar. Best for residential quotes.",
    accent: "#f97316",
  },
  {
    id: "classic",
    label: "Classic",
    description: "Traditional formal style with a bordered header. Best for commercial and B2B clients.",
    accent: "#1e293b",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Simple, distraction-free layout. Best for fast approvals and digital-first clients.",
    accent: "#6366F1",
  },
];

const SEQUENCE_TYPE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  quote_not_booked: "Quote Not Booked",
  invoice_not_paid: "Invoice Not Paid",
};

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sequences } = await supabase
    .from("email_sequences")
    .select("*")
    .eq("is_active", true)
    .order("sequence_type")
    .order("step");

  // Group by type
  const byType: Record<string, typeof sequences> = {};
  for (const s of sequences ?? []) {
    if (!byType[s.sequence_type]) byType[s.sequence_type] = [];
    byType[s.sequence_type]!.push(s);
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-muted-foreground text-sm mt-1">Quote templates and email sequence templates</p>
      </div>

      {/* Quote templates */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Quote Templates</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEMPLATE_PREVIEWS.map((t) => (
            <div key={t.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Mini preview */}
              <div className="h-28 bg-gray-50 relative p-3 border-b">
                <div className="rounded bg-white border h-full p-2 space-y-1.5 shadow-sm">
                  <div className="h-2 rounded w-3/4" style={{ background: t.accent }} />
                  <div className="h-1.5 rounded bg-gray-200 w-full" />
                  <div className="h-1.5 rounded bg-gray-200 w-5/6" />
                  <div className="mt-2 h-1.5 rounded bg-gray-100 w-2/3" />
                  <div className="h-1.5 rounded bg-gray-100 w-1/2" />
                  <div className="h-2 rounded w-1/3 mt-1" style={{ background: t.accent, opacity: 0.4 }} />
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-sm">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                <a
                  href={`/quotes/new?template=${t.id}`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3 font-medium"
                >
                  Use this template →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email sequences */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Email Sequences</h2>
          <span className="text-xs text-muted-foreground ml-1">· Auto-sent based on triggers</span>
        </div>

        {Object.keys(SEQUENCE_TYPE_LABELS).map((type) => {
          const steps = byType[type] ?? [];
          return (
            <div key={type} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{SEQUENCE_TYPE_LABELS[type]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{steps.length} step{steps.length !== 1 ? "s" : ""}</span>
                  <a href="/comms/sequences" className="text-xs text-primary hover:underline">Edit →</a>
                </div>
              </div>
              {steps.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  No steps configured.{" "}
                  <a href="/comms/sequences" className="text-primary hover:underline">Set up sequence →</a>
                </p>
              ) : (
                <div className="divide-y">
                  {steps.map((s) => (
                    <div key={s.id} className="flex items-start gap-4 px-5 py-3.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                        {s.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.label ? `${s.label} · ` : ""}Send after {s.delay_days} day{s.delay_days !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
