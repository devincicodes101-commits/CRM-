"use client";

import { useState, useMemo } from "react";
import { ClipboardCheck, CheckCircle2, XCircle, Clock, FileWarning, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Contractor = any;
type Status = "ok" | "missing" | "expired" | "expiring";
type Result = { label: string; status: Status; detail: string };

const STATUS_CONFIG: Record<Status, { icon: LucideIcon; color: string; bg: string; label: string; badge: "secondary" | "destructive" }> = {
  ok: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "OK", badge: "secondary" },
  missing: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Missing", badge: "destructive" },
  expired: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Expired", badge: "destructive" },
  expiring: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "Expiring", badge: "secondary" },
};

// Compliance items: [label, document field, expiry field]. RAMS has no expiry.
const ITEMS: [string, string, string | null][] = [
  ["Public Liability Insurance", "public_liability_doc", "public_liability_expiry"],
  ["Employers' Liability Insurance", "employer_liability_doc", "employer_liability_expiry"],
  ["General Insurance", "insurance_doc", "insurance_expiry"],
  ["Waste Carrier Licence", "waste_carrier_licence_doc", "waste_carrier_expiry"],
  ["Asbestos Licence", "asbestos_licence_doc", "asbestos_licence_expiry"],
  ["RAMS Document", "rams_doc", null],
];

function checkCompliance(c: Contractor | undefined): Result[] {
  if (!c) return [];
  const now = Date.now();
  const soon = 30 * 86400000;
  return ITEMS.map(([label, docField, expField]) => {
    const hasDoc = !!c[docField];
    if (!hasDoc) return { label, status: "missing", detail: "No document on file" };
    if (!expField) return { label, status: "ok", detail: "On file" };
    const exp = c[expField];
    if (!exp) return { label, status: "ok", detail: "On file (no expiry recorded)" };
    const t = new Date(exp).getTime();
    const dateStr = new Date(exp).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    if (t < now) return { label, status: "expired", detail: `Expired ${dateStr}` };
    if (t - now <= soon) return { label, status: "expiring", detail: `Expires ${dateStr}` };
    return { label, status: "ok", detail: `Valid until ${dateStr}` };
  });
}

export function MissingDocsChecker({ contractors }: { contractors: Contractor[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [checked, setChecked] = useState(false);
  const contractor = contractors?.find((c) => c.id === selectedId);
  const results = useMemo(() => checkCompliance(contractor), [contractor]);
  const outstanding = results.filter((r) => r.status !== "ok");
  const allOk = checked && outstanding.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardCheck className="w-5 h-5 text-violet-500" />
        <p className="text-sm text-muted-foreground">
          Checks which compliance documents and licences are missing, expired, or expiring soon for a selected contractor.
        </p>
      </div>

      <div className="grid gap-3">
        <div>
          <label className="text-sm font-medium">Select Contractor</label>
          <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setChecked(false); }}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm mt-1">
            <option value="">Choose a contractor…</option>
            {contractors?.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name || c.contact_name || c.email}</option>
            ))}
          </select>
        </div>
        <Button onClick={() => contractor && setChecked(true)} disabled={!contractor} className="gap-2">
          <ClipboardCheck className="w-4 h-4" /> Check Documents
        </Button>
      </div>

      {checked && contractor && (
        <div className="space-y-3">
          {allOk ? (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-700">All documents in order</p>
                <p className="text-sm text-emerald-600">No missing or expired compliance documents detected.</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex items-center gap-3">
              <FileWarning className="w-6 h-6 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-700">{outstanding.length} item(s) need attention</p>
                <p className="text-sm text-amber-600">Missing, expired, or expiring compliance documents listed below.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {results.map((r) => {
              const cfg = STATUS_CONFIG[r.status];
              const Icon = cfg.icon;
              return (
                <div key={r.label} className={cn("flex items-start gap-3 p-3 rounded-lg border", cfg.bg)}>
                  <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{r.label}</p>
                      <Badge variant={cfg.badge} className="text-[10px]">{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!checked && (
        <p className="text-sm text-muted-foreground text-center py-8">Select a contractor and click &quot;Check Documents&quot; to run the compliance check.</p>
      )}
    </div>
  );
}
