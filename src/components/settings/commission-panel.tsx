"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CommissionSettings } from "@/lib/schemas/admin";

export function CommissionPanel({ settings }: { settings: CommissionSettings | null }) {
  const [rate, setRate] = useState(settings?.rate_percent ?? 5);
  const [period, setPeriod] = useState<"weekly" | "monthly">(settings?.period ?? "monthly");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const supabase = createClient();
      if (settings) {
        const { error } = await supabase
          .from("commission_settings")
          .update({ rate_percent: rate, period })
          .eq("id", settings.id);
        if (error) { toast.error(error.message); return; }
      } else {
        const { error } = await supabase
          .from("commission_settings")
          .insert({ rate_percent: rate, period, qualifying_statuses: ["accepted"] });
        if (error) { toast.error(error.message); return; }
      }
      toast.success("Commission settings saved");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <h2 className="font-semibold text-sm">Commission Settings</h2>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Commission Rate (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="h-8 text-sm"
          />
          <p className="text-xs text-muted-foreground">Applied to accepted quotes value</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Payout Period</Label>
          <Select value={period} onValueChange={(v) => setPeriod(v as "weekly" | "monthly")}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" size="sm" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}