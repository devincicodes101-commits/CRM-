import { redirect } from "next/navigation";
import { Globe, Trash2, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AsyncButton } from "@/components/ui/async-button";
import { DomainForm } from "./domain-form";
import { deleteWebsiteDomain } from "./actions";

type Row = {
  id: string; domain_name: string; domain_url: string; status: string;
  google_analytics_id: string | null; seo_focus_keywords: string[]; monthly_traffic_goal: number | null; notes: string | null;
};

export default async function WebsiteDomainsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single<{ role: string }>();
  if (!me || me.role !== "admin") redirect("/dashboard");

  const { data: domains } = await supabase
    .from("website_domains")
    .select("id, domain_name, domain_url, status, google_analytics_id, seo_focus_keywords, monthly_traffic_goal, notes")
    .order("created_date", { ascending: false })
    .returns<Row[]>();

  const rows = domains ?? [];

  async function remove(id: string) {
    "use server";
    await deleteWebsiteDomain(id);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="size-6 text-sky-500" /> Website & SEO</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your websites, analytics and SEO focus keywords.</p>
      </div>

      <DomainForm />

      <div className="rounded-xl border bg-card overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">No domains yet — add one above.</p>
        ) : (
          <ul className="divide-y">
            {rows.map((d) => (
              <li key={d.id} className="px-4 py-3 flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{d.domain_name}</p>
                    <a href={d.domain_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5 text-xs">
                      <ExternalLink className="size-3" /> visit
                    </a>
                  </div>
                  {d.seo_focus_keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {d.seo_focus_keywords.map((k) => (
                        <span key={k} className="text-[10px] rounded-full bg-muted px-2 py-0.5">{k}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {d.google_analytics_id ? `GA: ${d.google_analytics_id}` : "No analytics"}
                    {d.monthly_traffic_goal ? ` · Goal ${d.monthly_traffic_goal.toLocaleString()}/mo` : ""}
                  </p>
                  {d.notes && <p className="text-xs text-muted-foreground italic">{d.notes}</p>}
                </div>
                <AsyncButton action={remove.bind(null, d.id)} variant="outline" size="xs">
                  <Trash2 className="size-3.5" />
                </AsyncButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
