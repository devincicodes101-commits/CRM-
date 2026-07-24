"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, X, Search, Layers } from "lucide-react";
import { createServiceTemplate, deleteServiceTemplate } from "./actions";
import type { ServiceTemplate } from "@/lib/schemas/service-templates";

type ServiceOption = { id: string; name: string; category: string; unit_price: number; unit_type: string };

export function TemplatesClient({ templates, services }: { templates: ServiceTemplate[]; services: ServiceOption[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<ServiceOption[]>([]);
  const [search, setSearch] = useState("");
  const [pending, start] = useTransition();

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const chosen = new Set(picked.map((p) => p.id));
    return services.filter((s) => !chosen.has(s.id)).filter((s) => !q || s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [services, search, picked]);

  const total = picked.reduce((s, p) => s + (p.unit_price || 0), 0);

  function save() {
    if (!name.trim()) { toast.error("Name your template"); return; }
    if (picked.length === 0) { toast.error("Add at least one service"); return; }
    start(async () => {
      const res = await createServiceTemplate({
        name,
        items: picked.map((p) => ({ service_id: p.id, service_name: p.name, unit_price: p.unit_price, unit_type: p.unit_type, quantity: 1 })),
      });
      if ("error" in res) toast.error(res.error);
      else { toast.success("Template saved"); setName(""); setPicked([]); router.refresh(); }
    });
  }

  function remove(id: string) {
    start(async () => { await deleteServiceTemplate(id); router.refresh(); });
  }

  return (
    <div className="space-y-6">
      {/* Create */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">New Template</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name e.g. Standard Garage Roof Package" className="w-full rounded-md border px-3 py-2 text-sm" />
        {picked.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {picked.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-1">
                {p.name} · £{p.unit_price}
                <button onClick={() => setPicked(picked.filter((x) => x.id !== p.id))} className="hover:text-destructive"><X className="size-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services to add…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          {search && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md max-h-56 overflow-y-auto">
              {results.map((s) => (
                <button key={s.id} onClick={() => { setPicked([...picked, s]); setSearch(""); }} className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted">
                  <span>{s.name}</span><span className="font-medium">£{s.unit_price}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total: <strong className="text-foreground">£{total.toLocaleString("en-GB")}</strong></span>
          <button onClick={save} disabled={pending} className="inline-flex items-center gap-1.5 rounded-md bg-primary text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
            <Plus className="size-4" /> Save Template
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            <Layers className="size-8 mx-auto mb-2 opacity-40" />
            No templates yet. Create one above, then apply it from the quote builder.
          </div>
        ) : templates.map((t) => (
          <div key={t.id} className="rounded-xl border bg-card p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{t.items.map((i) => i.service_name).join(", ")}</p>
              <p className="text-sm mt-1">£{t.items.reduce((s, i) => s + (i.unit_price || 0), 0).toLocaleString("en-GB")} · {t.items.length} service{t.items.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={() => remove(t.id)} disabled={pending} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
