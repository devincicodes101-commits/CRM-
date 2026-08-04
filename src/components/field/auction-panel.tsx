"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gavel, Clock } from "lucide-react";
import { placeAuctionBid, respondToInvite } from "@/app/(protected)/field/jobs/[id]/bid-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  jobId: string;
  mode: "auction" | "invite";
  currentBid: number;
  endsAt: string | null;
  alreadyResponded: boolean;
};

const gbp = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function FieldAuctionPanel({ jobId, mode, currentBid, endsAt, alreadyResponded }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [price, setPrice] = useState("");
  const [now, setNow] = useState(() => Date.now());

  // Live countdown + 3s poll so the current bid stays fresh even without a bid
  // of our own (Realtime fallback per §3).
  useEffect(() => {
    if (mode !== "auction" || !endsAt) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(() => router.refresh(), 3000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [mode, endsAt, router]);

  const msLeft = endsAt ? new Date(endsAt).getTime() - now : 0;
  const ended = mode === "auction" && !!endsAt && msLeft <= 0;
  const countdown = (() => {
    if (!endsAt) return "";
    if (msLeft <= 0) return "closing…";
    const m = Math.floor(msLeft / 60000);
    const s = Math.floor((msLeft % 60000) / 1000);
    return `${m}:${String(s).padStart(2, "0")}`;
  })();

  function bid() {
    const val = Number(amount);
    if (!(val > currentBid)) {
      toast.error(`Bid must be higher than ${gbp(currentBid)}`);
      return;
    }
    start(async () => {
      const r = await placeAuctionBid(jobId, val);
      if ("error" in r) toast.error(r.error);
      else {
        toast.success(`Bid placed at ${gbp(r.currentBid)}`);
        setAmount("");
        router.refresh();
      }
    });
  }

  function respond(status: "interested" | "declined") {
    start(async () => {
      const r = await respondToInvite(jobId, status, note, price === "" ? null : Number(price));
      if ("error" in r) toast.error(r.error);
      else {
        toast.success(status === "interested" ? "Interest registered" : "Invite declined");
        router.refresh();
      }
    });
  }

  if (mode === "auction") {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-amber-800 dark:text-amber-200 inline-flex items-center gap-1.5">
            <Gavel className="size-4" /> Job Auction
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-amber-800 dark:text-amber-200">
            <Clock className="size-3.5" /> {countdown}
          </span>
        </div>
        <p className="text-sm">Current highest bid: <strong>{gbp(currentBid)}</strong></p>
        {ended ? (
          <p className="text-sm text-muted-foreground">This auction has closed.</p>
        ) : (
          <div className="flex gap-2">
            <Input
              type="number"
              inputMode="decimal"
              placeholder={`More than ${gbp(currentBid)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11"
            />
            <Button type="button" onClick={bid} disabled={pending} className="h-11">
              Place Bid
            </Button>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">Highest bid when the timer ends wins the job.</p>
      </div>
    );
  }

  // Invite mode
  if (alreadyResponded) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Thanks — your response has been recorded.
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <h2 className="font-semibold text-sm">You&apos;ve been invited to this job</h2>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)…"
        rows={2}
      />
      <Input
        type="number"
        inputMode="decimal"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Propose a price £ (optional)"
      />
      <div className="flex gap-2">
        <Button type="button" onClick={() => respond("interested")} disabled={pending} className="flex-1">
          Register Interest
        </Button>
        <Button type="button" variant="outline" onClick={() => respond("declined")} disabled={pending} className="flex-1">
          Decline
        </Button>
      </div>
    </div>
  );
}
