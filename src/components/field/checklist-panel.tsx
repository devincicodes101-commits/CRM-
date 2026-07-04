"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleChecklistItem } from "@/app/(protected)/field/actions";
import { cn } from "@/lib/utils";
import type { JobChecklistItem } from "@/lib/schemas/jobs";

type Props = {
  jobId: string;
  initialItems: JobChecklistItem[];
  disabled?: boolean;
};

export function ChecklistPanel({ jobId, initialItems, disabled }: Props) {
  const [items, setItems] = useState(initialItems);
  const [pending, startTransition] = useTransition();

  function toggle(index: number) {
    if (disabled) return;
    const updated = items.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    );
    setItems(updated);
    startTransition(async () => {
      const result = await toggleChecklistItem(jobId, updated);
      if (result?.error) {
        // rollback
        setItems(items);
        toast.error(result.error);
      }
    });
  }

  const done = items.filter((i) => i.checked).length;

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No checklist items for this job.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {done}/{items.length} complete
      </p>
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${items.length > 0 ? (done / items.length) * 100 : 0}%` }}
        />
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i}>
            <button
              type="button"
              disabled={pending || disabled}
              onClick={() => toggle(i)}
              className={cn(
                "w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                item.checked
                  ? "bg-primary/5 border-primary/30"
                  : "bg-card border-border hover:bg-muted/50",
                disabled && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 size-5 rounded border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                  item.checked
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border"
                )}
              >
                {item.checked ? "✓" : ""}
              </span>
              <div>
                <p className={cn("text-sm font-medium", item.checked && "line-through text-muted-foreground")}>
                  {item.label}
                </p>
                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}