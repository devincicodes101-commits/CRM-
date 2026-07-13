"use client";

import { useState } from "react";
import { submitRescheduleRequest } from "./actions";

type Props = {
  jobId: string;
  jobTitle: string;
  customerName: string;
  customerEmail: string;
  originalDate: string | null;
};

export function RescheduleForm({
  jobId,
  jobTitle,
  customerName,
  customerEmail,
  originalDate,
}: Props) {
  const [requestedDate, setRequestedDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await submitRescheduleRequest({
      jobId,
      customerEmail,
      customerName,
      jobTitle,
      originalDate: originalDate ?? undefined,
      requestedDate,
      reason,
    });

    setSubmitting(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center space-y-2">
        <div className="text-4xl">✅</div>
        <h2 className="text-lg font-semibold">Request Received</h2>
        <p className="text-sm text-muted-foreground">
          We have received your reschedule request and will be in touch to confirm
          the new date.
        </p>
      </div>
    );
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">
          Preferred New Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          min={minDateStr}
          required
          value={requestedDate}
          onChange={(e) => setRequestedDate(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Reason for Reschedule
        </label>
        <textarea
          rows={3}
          placeholder="Please let us know why you need to reschedule..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !requestedDate}
        className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting…" : "Request Reschedule"}
      </button>
    </form>
  );
}
