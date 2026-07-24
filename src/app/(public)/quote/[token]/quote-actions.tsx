"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { getBookingSuggestions, declineQuotePublic } from "./actions";
import { BookingPanel } from "./booking-panel";
import type { DateSuggestion } from "@/lib/booking";
import { Button } from "@/components/ui/button";

type Props = { token: string };

export function QuoteActions({ token }: Props) {
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"accept" | "decline" | null>(null);
  const [done, setDone] = useState<"declined" | null>(null);
  const [suggestions, setSuggestions] = useState<DateSuggestion[] | null>(null);

  function handleAccept() {
    setAction("accept");
    startTransition(async () => {
      const result = await getBookingSuggestions(token);
      if ("error" in result) {
        toast.error(result.error);
        setAction(null);
      } else {
        setSuggestions(result.suggestions);
      }
    });
  }

  function handleDecline() {
    setAction("decline");
    startTransition(async () => {
      const result = await declineQuotePublic(token);
      if (result?.error) {
        toast.error(result.error);
        setAction(null);
      } else {
        setDone("declined");
      }
    });
  }

  // After Accept, show the date picker (which books the job on confirm).
  if (suggestions) {
    return <BookingPanel token={token} suggestions={suggestions} />;
  }

  if (done === "declined") {
    return (
      <div className="rounded-xl border bg-muted p-6 text-center space-y-2">
        <p className="font-semibold text-muted-foreground text-lg">Quote Declined</p>
        <p className="text-sm text-muted-foreground">
          You have declined this quote. Please contact us if you&apos;d like to discuss your options.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-background p-6 space-y-4">
      <div className="text-center space-y-1">
        <h2 className="font-semibold text-base">Ready to proceed?</h2>
        <p className="text-sm text-muted-foreground">
          Accept this quote to confirm your booking, or decline if you&apos;d like to pass.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          className="flex-1 h-12 text-base"
          onClick={handleAccept}
          disabled={pending}
        >
          <CheckCircle className="size-5" />
          {action === "accept" && pending ? "Processing…" : "Accept Quote"}
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-12 text-base"
          onClick={handleDecline}
          disabled={pending}
        >
          <XCircle className="size-5" />
          {action === "decline" && pending ? "Processing…" : "Decline"}
        </Button>
      </div>
    </div>
  );
}