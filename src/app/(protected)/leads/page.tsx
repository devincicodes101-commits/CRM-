import Link from "next/link";
import { Plus, Download, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/schemas/leads";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-purple-100 text-purple-700",
  qualified: "bg-yellow-100 text-yellow-700",
  appointment_booked: "bg-cyan-100 text-cyan-700",
  quoted: "bg-orange-100 text-orange-700",
  negotiation: "bg-indigo-100 text-indigo-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

const SOURCE_ICONS: Record<string, string> = {
  facebook: "📘", instagram: "📸", tiktok: "🎵", twitter: "🐦",
  linkedin: "💼", website_form: "🌐", google_ads: "🔍", referral: "🤝", other: "📌",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; q?: string; view?: string }>;
}) {
  const { status, source, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("leads").select("*");
  if (status && status !== "all") query = query.eq("status", status);
  if (source && source !== "all") query = query.eq("source", source);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data: leads } = await query
    .order("created_date", { ascending: false })
    .returns<Lead[]>();
  const list = leads ?? [];

  const totalLeads = list.length;
  const newLeads = list.filter((l) => l.status === "new").length;
  const converted = list.filter((l) => l.status === "won").length;
  const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(0) : "0";
  const pipelineValue = list.reduce((s, l) => s + Number(l.estimated_value ?? 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track and manage incoming enquiries from all channels</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-sm border rounded-xl px-4 py-2 hover:bg-muted transition-colors font-medium">
            <Download className="size-4" /> Import CSV
          </button>
          <Link
            href="/leads/new"
            className="flex items-center gap-1.5 text-sm rounded-xl px-4 py-2 bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" /> Add Lead
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: totalLeads.toString(), color: "text-foreground" },
          { label: "New", value: newLeads.toString(), color: "text-blue-600" },
          { label: "Conversion Rate", value: `${conversionRate}%`, color: "text-green-600" },
          { label: "Pipeline Value", value: `£${pipelineValue.toLocaleString()}`, color: "text-orange-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border bg-white shadow-sm p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <form className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-3 top-2.5 size-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search leads…"
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        <select
          name="status"
          defaultValue={status ?? "all"}
          className="text-sm border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Statuses</option>
          {["new", "contacted", "qualified", "appointment_booked", "quoted", "negotiation", "won", "lost"].map((s) => (
            <option key={s} value={s} className="capitalize">{s.replace("_", " ").charAt(0).toUpperCase() + s.replace("_", " ").slice(1)}</option>
          ))}
        </select>

        <select
          name="source"
          defaultValue={source ?? "all"}
          className="text-sm border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Sources</option>
          {["website", "referral", "google", "social_media", "phone", "email", "walk_in", "other"].map((s) => (
            <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>
          ))}
        </select>

        <button className="flex items-center gap-1.5 text-sm border rounded-xl px-3 py-2 hover:bg-muted transition-colors ml-auto font-medium">
          <Users className="size-4" /> Sort by Score
        </button>
      </div>

      {/* Lead list */}
      {list.length === 0 ? (
        <div className="rounded-2xl border bg-white shadow-sm p-16 text-center">
          <Users className="size-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="font-semibold text-lg">No leads found</p>
          <p className="text-muted-foreground text-sm mt-1">Add your first lead to get started</p>
          <Link href="/leads/new" className="inline-flex items-center gap-1.5 mt-4 text-sm rounded-xl px-4 py-2 bg-primary text-white font-medium hover:bg-primary/90 transition-colors">
            <Plus className="size-4" /> Add Lead
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="divide-y">
            {list.map((lead) => (
              <div key={lead.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                  {SOURCE_ICONS[lead.source ?? "other"] ?? "📌"}
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/leads/${lead.id}`} className="font-semibold hover:text-primary transition-colors">
                    {lead.name}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {lead.service_interest ?? "No service specified"}
                    {lead.source && ` · ${lead.source.replace("_", " ")}`}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {lead.estimated_value && (
                    <span className="text-sm font-semibold text-primary">
                      £{Number(lead.estimated_value).toLocaleString()}
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_STYLES[lead.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {lead.status.replace("_", " ")}
                  </span>
                  <Link
                    href={`/leads/${lead.id}/edit`}
                    className="text-xs border rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
