import { AlertTriangle } from "lucide-react";

// §19 — shown on customer / job / quote views when a customer's email has bounced
// or been marked as spam. Read-only; never blocks sending.
export function EmailUndeliverableWarning({ status }: { status: string | null | undefined }) {
  if (status !== "bounced" && status !== "complained") return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 text-sm">
      <AlertTriangle className="size-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
      <p className="text-red-800 dark:text-red-200">
        Emails to this customer may not deliver
        {status === "complained" ? " (they marked a previous email as spam)" : " (a previous email bounced)"}
        {" "}— contact them by phone.
      </p>
    </div>
  );
}
