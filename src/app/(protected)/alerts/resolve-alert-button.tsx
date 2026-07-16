"use client";

import { useTransition } from "react";
import { updateAlertStatus } from "./actions";

export function ResolveAlertButton({
  alertId,
  action,
}: {
  alertId: string;
  action: "resolved" | "archived";
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await updateAlertStatus(alertId, action);
      if (result?.error) alert(result.error);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors disabled:opacity-50 ${
        action === "resolved"
          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
          : "hover:bg-muted text-muted-foreground"
      }`}
    >
      {isPending
        ? "…"
        : action === "resolved"
          ? "Resolve"
          : "Archive"}
    </button>
  );
}
