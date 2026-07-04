"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { saveMaterials } from "@/app/(protected)/field/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { JobMaterial } from "@/lib/schemas/jobs";

type Props = {
  jobId: string;
  initialMaterials: JobMaterial[];
  disabled?: boolean;
};

const UNITS = ["unit", "m", "m²", "m³", "kg", "L", "bag", "pack", "roll", "box"];

export function MaterialsLogger({ jobId, initialMaterials, disabled }: Props) {
  const [materials, setMaterials] = useState<JobMaterial[]>(initialMaterials);
  const [pending, startTransition] = useTransition();

  function addRow() {
    setMaterials((prev) => [...prev, { name: "", quantity: 1, unit: "unit", unit_cost: undefined }]);
  }

  function removeRow(i: number) {
    setMaterials((prev) => prev.filter((_, idx) => idx !== i));
  }

  function update<K extends keyof JobMaterial>(i: number, key: K, value: JobMaterial[K]) {
    setMaterials((prev) => prev.map((m, idx) => (idx === i ? { ...m, [key]: value } : m)));
  }

  function save() {
    startTransition(async () => {
      const valid = materials.filter((m) => m.name.trim());
      const result = await saveMaterials(jobId, valid);
      if (result?.error) toast.error(result.error);
      else toast.success("Materials saved");
    });
  }

  return (
    <div className="space-y-3">
      {materials.length === 0 && (
        <p className="text-sm text-muted-foreground">No materials logged yet.</p>
      )}
      {materials.map((mat, i) => (
        <div key={i} className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Material name"
            value={mat.name}
            onChange={(e) => update(i, "name", e.target.value)}
            disabled={disabled}
            className="flex-1 min-w-[140px]"
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Qty"
            value={mat.quantity}
            onChange={(e) => update(i, "quantity", parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className="w-20"
          />
          <select
            value={mat.unit ?? "unit"}
            onChange={(e) => update(i, "unit", e.target.value)}
            disabled={disabled}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Cost £"
            value={mat.unit_cost ?? ""}
            onChange={(e) => update(i, "unit_cost", parseFloat(e.target.value) || undefined)}
            disabled={disabled}
            className="w-24"
          />
          {!disabled && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeRow(i)}>
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          )}
        </div>
      ))}
      {!disabled && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-3.5" /> Add Material
          </Button>
          {materials.length > 0 && (
            <Button type="button" size="sm" onClick={save} disabled={pending}>
              <Save className="size-3.5" />
              {pending ? "Saving…" : "Save"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}