"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Star, ChevronRight, CalendarCheck, MapPin, CheckCircle } from "lucide-react";
import { bookJobFromQuote } from "./actions";
import type { DateSuggestion } from "@/lib/booking";
import { Button } from "@/components/ui/button";

const AVAILABILITY: Record<
  DateSuggestion["availability"],
  { label: string; className: string }
> = {
  wide_open: { label: "Wide open", className: "bg-emerald-100 text-emerald-700" },
  available: { label: "Available", className: "bg-blue-100 text-blue-700" },
  busy: { label: "Busy", className: "bg-amber-100 text-amber-700" },
};

type Props = { token: string; suggestions: DateSuggestion[] };

export function BookingPanel({ token, suggestions }: Props) {
  const [selected, setSelected] = useState<DateSuggestion | null>(null);
  const [step, setStep] = useState<"pick" | "confirm">("pick");
  const [pending, start] = useTransition();
  const [booked, setBooked] = useState(false);

  function confirm() {
    if (!selected) return;
    start(async () => {
      const res = await bookJobFromQuote(token, selected.dateStr);
      if ("error" in res) toast.error(res.error);
      else setBooked(true);
    });
  }

  if (booked) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700 p-6 text-center space-y-2">
        <CheckCircle className="size-10 text-green-600 dark:text-green-400 mx-auto" />
        <p className="font-semibold text-green-800 dark:text-green-200 text-lg">You&apos;re Booked In! 🎉</p>
        <p className="text-sm text-green-700 dark:text-green-300">
          Your appointment is confirmed for <strong>{selected?.label}</strong>. A confirmation
          email is on its way — you can reschedule from there if you need to.
        </p>
        <p className="text-xs text-green-700/80 dark:text-green-300/80">
          All appointments are all-day; we cannot guarantee a specific arrival time.
        </p>
      </div>
    );
  }

  if (step === "confirm" && selected) {
    return (
      <div className="rounded-2xl border bg-background p-6 space-y-4">
        <div className="text-center space-y-1">
          <CalendarCheck className="size-8 text-primary mx-auto" />
          <h2 className="font-semibold text-lg">Confirm your booking</h2>
        </div>
        <div className="rounded-lg border bg-muted/40 p-4 space-y-1 text-sm">
          <p><span className="text-muted-foreground">Date:</span> <strong>{selected.label}</strong></p>
          <p className="text-muted-foreground text-xs">
            All-day appointment — time of arrival cannot be guaranteed.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-12" onClick={() => setStep("pick")} disabled={pending}>
            Back
          </Button>
          <Button className="flex-1 h-12 text-base" onClick={confirm} disabled={pending}>
            {pending ? "Booking…" : "Confirm Booking"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-background p-6 space-y-4">
      <div className="text-center space-y-1">
        <h2 className="font-semibold text-lg">Choose Your Preferred Date</h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ve found the best available dates based on your location for the fastest
          possible service.
        </p>
      </div>
      <div className="space-y-2">
        {suggestions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No dates available right now — please contact us to arrange a time.
          </p>
        )}
        {suggestions.map((s, i) => {
          const a = AVAILABILITY[s.availability];
          return (
            <button
              key={s.dateStr}
              onClick={() => {
                setSelected(s);
                setStep("confirm");
              }}
              className="w-full flex items-center gap-3 rounded-xl border p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
            >
              {i === 0 ? (
                <Star className="size-5 text-amber-400 fill-amber-400 shrink-0" />
              ) : (
                <span className="size-5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{s.label}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${a.className}`}>{a.label}</span>
                  {s.nearbyMiles !== null && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-blue-600">
                      <MapPin className="size-3" /> Team nearby ({s.nearbyMiles} mi away)
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
