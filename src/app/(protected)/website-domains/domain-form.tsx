"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createWebsiteDomain } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DomainForm() {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ domain_name: "", domain_url: "", google_analytics_id: "", seo_focus_keywords: "", monthly_traffic_goal: "", notes: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  function submit() {
    start(async () => {
      const r = await createWebsiteDomain({
        domain_name: f.domain_name,
        domain_url: f.domain_url,
        google_analytics_id: f.google_analytics_id,
        seo_focus_keywords: f.seo_focus_keywords,
        monthly_traffic_goal: f.monthly_traffic_goal ? Number(f.monthly_traffic_goal) : null,
        notes: f.notes,
      });
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Domain added");
        setF({ domain_name: "", domain_url: "", google_analytics_id: "", seo_focus_keywords: "", monthly_traffic_goal: "", notes: "" });
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Add Domain</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Domain name</Label><Input value={f.domain_name} onChange={set("domain_name")} placeholder="asbestosteams.com" /></div>
        <div className="space-y-1.5"><Label>URL</Label><Input value={f.domain_url} onChange={set("domain_url")} placeholder="https://asbestosteams.com" /></div>
        <div className="space-y-1.5"><Label>Google Analytics ID</Label><Input value={f.google_analytics_id} onChange={set("google_analytics_id")} placeholder="G-XXXXXXX" /></div>
        <div className="space-y-1.5"><Label>Monthly traffic goal</Label><Input type="number" value={f.monthly_traffic_goal} onChange={set("monthly_traffic_goal")} placeholder="5000" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>SEO keywords (comma-separated)</Label><Input value={f.seo_focus_keywords} onChange={set("seo_focus_keywords")} placeholder="asbestos removal, asbestos survey, licensed removal" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={f.notes} onChange={set("notes")} /></div>
      </div>
      <Button onClick={submit} disabled={pending || !f.domain_name || !f.domain_url}>{pending ? "Adding…" : "Add Domain"}</Button>
    </div>
  );
}
