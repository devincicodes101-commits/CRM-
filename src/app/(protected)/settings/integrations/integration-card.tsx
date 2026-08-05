"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveIntegrationConnection } from "./actions";

type Props = {
  intgKey: string;
  name: string;
  category: string;
  description: string;
  envStatus: { name: string; set: boolean }[];
  initialConnected: boolean;
  initialNotes: string;
};

export function IntegrationCard({ intgKey, name, category, description, envStatus, initialConnected, initialNotes }: Props) {
  const [connected, setConnected] = useState(initialConnected);
  const [notes, setNotes] = useState(initialNotes);
  const [pending, start] = useTransition();

  function save(nextConnected: boolean) {
    setConnected(nextConnected);
    start(async () => {
      const r = await saveIntegrationConnection({ key: intgKey, name, isConnected: nextConnected, notes });
      if ("error" in r) { toast.error(r.error); setConnected(!nextConnected); }
      else toast.success("Saved");
    });
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${connected ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
              {connected ? "Connected" : "Not connected"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">{category}</Badge>
      </div>
      <div className="space-y-1 border-t pt-3">
        {envStatus.map((v) => (
          <div key={v.name} className="flex items-center gap-1.5 text-xs">
            {v.set ? <CheckCircle className="size-3.5 text-green-500" /> : <XCircle className="size-3.5 text-red-400" />}
            <code className="font-mono">{v.name}</code>
          </div>
        ))}
      </div>
      <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Account notes (e.g. which account, plan)…" className="text-xs" />
      <div className="flex gap-2">
        <Button size="xs" variant={connected ? "outline" : "default"} disabled={pending} onClick={() => save(!connected)}>
          {connected ? "Mark disconnected" : "Mark connected"}
        </Button>
        <Button size="xs" variant="outline" disabled={pending} onClick={() => save(connected)}>Save notes</Button>
      </div>
    </div>
  );
}
