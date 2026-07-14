"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { acceptQuotePublic, declineQuotePublic } from "./actions";
import { Button } from "@/components/ui/button";

type Props = { token: string };

export function QuoteActions({ token }: Props) {
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"accept" | "decline" | null>(null);
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);

  function handleAccept() {
    setAction("accept");
    startTransition(async () => {
      const result = await acceptQuotePublic(token);
      if (result?.error) {
        toast.error(result.error);
        setAction(null);
      } else {
        setDone("accepted");
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

  if (done === "accepted") {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700 p-6 text-center space-y-2">
        <CheckCircle className="size-10 text-green-600 dark:text-green-400 mx-auto" />
        <p className="font-semibold text-green-800 dark:text-green-200 text-lg">Quote Accepted!</p>
        <p className="text-sm text-green-700 dark:text-green-300">
          Thank you for accepting. We'll be in touch shortly to confirm your booking.
        </p>
      </div>
    );
  }

  if (done === "declined") {
    return (
      <div className="rounded-xl border bg-muted p-6 text-center space-y-2">
        <p className="font-semibold text-muted-foreground text-lg">Quote Declined</p>
        <p className="text-sm text-muted-foreground">
          You have declined this quote. Please contact us if you'd like to discuss your options.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-background p-6 space-y-4">
      <div className="text-center space-y-1">
        <h2 className="font-semibold text-base">Ready to proceed?</h2>
        <p className="text-sm text-muted-foreground">
          Accept this quote to confirm your booking, or decline if you'd like to pass.
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