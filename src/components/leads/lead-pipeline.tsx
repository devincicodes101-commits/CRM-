"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { updateLeadStatus } from "@/app/(protected)/leads/actions";
import type { Lead } from "@/lib/schemas/leads";

const STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "appointment_booked", label: "Booked" },
  { key: "quoted", label: "Quoted" },
  { key: "negotiation", label: "Negotiation" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
] as const;

const PRIORITY_COLORS = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
} as const;

type Props = { leads: Lead[] };

export function LeadPipeline({ leads }: Props) {
  const [, startTransition] = useTransition();

  function moveTo(id: string, status: string) {
    startTransition(async () => {
      const result = await updateLeadStatus(id, status);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.key);
          return (
            <div
              key={stage.key}
              className="w-56 flex-shrink-0 rounded-xl border bg-muted/40 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {stage.label}
                </span>
                <span className="text-xs bg-muted rounded-full px-1.5 py-0.5 tabular-nums">
                  {stageLeads.length}
                </span>
              </div>
              {stageLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-lg border bg-card p-3 space-y-1.5 shadow-xs hover:shadow-sm transition-shadow"
                >
                  <Link href={`/leads/${lead.id}`} className="text-sm font-medium hover:underline block">
                    {lead.name}
                  </Link>
                  {lead.service_interest && (
                    <p className="text-xs text-muted-foreground truncate">{lead.service_interest}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant={PRIORITY_COLORS[lead.priority ?? "medium"]} className="text-[10px] h-4">
                      {lead.priority}
                    </Badge>
                    {lead.estimated_value != null && (
                      <span className="text-xs text-muted-foreground">
                        £{Number(lead.estimated_value).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {STAGES.filter((s) => s.key !== stage.key).slice(0, 2).map((s) => (
                      <button
                        key={s.key}
                        onClick={() => moveTo(lead.id, s.key)}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:bg-muted transition-colors"
                      >
                        → {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}