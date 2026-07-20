"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { registerSubcontractor } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "asbestos", "demolition", "insulation", "roofing", "plumbing", "electrical",
  "painting", "flooring", "landscaping", "renovation", "concrete", "carpentry", "general",
];

export function SubcontractorRegisterForm() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [cats, setCats] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", company_name: "", email: "", phone: "", starting_postcode: "", max_radius_miles: "", covered_areas: "",
  });

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function toggleCat(c: string) {
    setCats((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  }

  function submit() {
    start(async () => {
      const res = await registerSubcontractor({
        name: form.name,
        company_name: form.company_name,
        email: form.email,
        phone: form.phone,
        starting_postcode: form.starting_postcode,
        max_radius_miles: form.max_radius_miles ? Number(form.max_radius_miles) : undefined,
        service_categories: cats,
        covered_areas: form.covered_areas.split(",").map((s) => s.trim()).filter(Boolean),
      });
      if ("error" in res) toast.error(res.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700 p-8 text-center space-y-2">
        <CheckCircle className="size-10 text-green-600 dark:text-green-400 mx-auto" />
        <p className="font-semibold text-green-800 dark:text-green-200 text-lg">Application received</p>
        <p className="text-sm text-green-700 dark:text-green-300">
          Thanks for applying to join our network. Our team will review your details and be in touch.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-background p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Contact name *"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Company name *"><Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} /></Field>
        <Field label="Email *"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Base postcode"><Input value={form.starting_postcode} onChange={(e) => set("starting_postcode", e.target.value)} placeholder="e.g. M1 2AB" /></Field>
        <Field label="Coverage radius (miles)"><Input type="number" value={form.max_radius_miles} onChange={(e) => set("max_radius_miles", e.target.value)} placeholder="e.g. 30" /></Field>
      </div>

      <Field label="Areas covered (comma-separated postcodes/towns)">
        <Input value={form.covered_areas} onChange={(e) => set("covered_areas", e.target.value)} placeholder="M, BL, Manchester, Bolton" />
      </Field>

      <div className="space-y-2">
        <Label>Services offered</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCat(c)}
              className={cn(
                "px-3 py-1 rounded-full border text-sm capitalize transition-colors",
                cats.includes(c) ? "bg-primary text-white border-primary" : "hover:bg-muted"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={submit} disabled={pending} className="w-full sm:w-auto">
        {pending ? "Submitting…" : "Submit application"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
