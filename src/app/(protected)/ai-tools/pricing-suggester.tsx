"use client";

import { useState, useTransition } from "react";
import { PoundSterling, Loader2, Copy, Check, AlertTriangle, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { suggestPricing } from "./actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Service = any;

export function PricingSuggester({ services }: { services: Service[] }) {
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [area, setArea] = useState("");
  const [access, setAccess] = useState("");
  const [wasteType, setWasteType] = useState("");
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, start] = useTransition();

  const selectedService = services?.find((s) => s.id === selectedServiceId);

  function handleGenerate() {
    setError(""); setOutput("");
    start(async () => {
      const res = await suggestPricing({
        serviceName: selectedService?.name,
        serviceCategory: selectedService?.category,
        area, access, wasteType, notes,
        unitPrice: selectedService?.unit_price,
        unitType: selectedService?.unit_type,
      });
      if (res.ok) setOutput(res.text);
      else setError(res.error);
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="w-5 h-5 text-emerald-500" />
        <p className="text-sm text-muted-foreground">
          AI-generated indicative price estimate — not a binding quote. Final pricing must be set by a human estimator.
        </p>
      </div>

      <div className="grid gap-3">
        <div>
          <Label>Service</Label>
          <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">Choose a service…</option>
            {services?.map((s) => (
              <option key={s.id} value={s.id}>{s.name} (£{s.unit_price} {s.unit_type})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Area / Quantity</Label>
            <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. 50 m² or 3 units" />
          </div>
          <div>
            <Label>Access Type</Label>
            <Input value={access} onChange={(e) => setAccess(e.target.value)} placeholder="e.g. 3rd floor, scaffolding" />
          </div>
        </div>

        <div>
          <Label>Waste Type</Label>
          <Input value={wasteType} onChange={(e) => setWasteType(e.target.value)} placeholder="e.g. cement sheets, AIB, textured coating" />
        </div>

        <div>
          <Label>Additional Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any other details affecting price…" rows={2} />
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Estimating…</> : <><PoundSterling className="w-4 h-4" /> Suggest Pricing</>}
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {output && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1"><PoundSterling className="w-3 h-3" /> Indicative Estimate</Badge>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1">
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </Button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{output}</div>
        </div>
      )}
    </div>
  );
}
