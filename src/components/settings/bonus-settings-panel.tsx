"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { BonusSettings } from "@/lib/schemas/admin";

export function BonusSettingsPanel({ settings }: { settings: BonusSettings[] }) {
  const [adding, setAdding] = useState(false);
  const [tierName, setTierName] = useState("");
  const [minRating, setMinRating] = useState(4);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("bonus_settings").insert({
        tier_name: tierName || `Tier ${settings.length + 1}`,
        min_star_rating: minRating,
        bonus_amount_gbp: bonusAmount,
        is_active: true,
        priority: settings.length,
        min_jobs_completed: null,
      });
      if (error) toast.error(error.message);
      else { toast.success("Bonus tier added"); setAdding(false); setTierName(""); router.refresh(); }
    });
  }

  async function handleToggle(id: string, isActive: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("bonus_settings")
      .update({ is_active: isActive })
      .eq("id", id);
    if (error) toast.error(error.message);
    else router.refresh();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("bonus_settings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else router.refresh();
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Bonus Tiers</h2>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="h-7 text-xs">
          <Plus className="size-3.5" /> Add Tier
        </Button>
      </div>

      {settings.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground italic">No bonus tiers configured.</p>
      )}

      <div className="space-y-2">
        {settings.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
          >
            <div>
              <p className="font-medium">{s.tier_name ?? `Tier ${s.priority + 1}`}</p>
              <p className="text-xs text-muted-foreground">
                Min rating: {s.min_star_rating}★ · Bonus: £{s.bonus_amount_gbp}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={s.is_active}
                onCheckedChange={(v) => handleToggle(s.id, v)}
              />
              <Button
                size="xs"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(s.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="space-y-3 border rounded-lg p-3 bg-muted/30">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 space-y-1">
              <Label className="text-xs">Tier Name</Label>
              <Input
                value={tierName}
                onChange={(e) => setTierName(e.target.value)}
                placeholder="Gold, Platinum…"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Min Rating</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Bonus Amount (£)</Label>
              <Input
                type="number"
                min={0}
                value={bonusAmount}
                onChange={(e) => setBonusAmount(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending} className="h-7 text-xs">
              Add
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setAdding(false)} className="h-7 text-xs">
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}