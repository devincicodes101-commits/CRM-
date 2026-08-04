"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Gavel, Users, UserPlus, Search, Loader2, Clock } from "lucide-react";
import {
  inviteContractorsForJob,
  createAuction,
  resolveAuction,
  assignContractorFromBid,
} from "@/app/(protected)/jobs/bid-actions";
import { getContractorPickerData, type ContractorCard } from "@/app/(protected)/jobs/picker-actions";
import { AUCTION } from "@/lib/auction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type ContractorBid = {
  id: string;
  contractor_id: string;
  contractor_name: string | null;
  contractor_email: string | null;
  status: "invited" | "interested" | "declined";
  note: string | null;
  proposed_price: number | null;
  bid_amount: number | null;
  is_auction_bid: boolean;
  bid_time: string | null;
  invited_date: string | null;
  responded_date: string | null;
};

type Props = {
  jobId: string;
  bids: ContractorBid[];
  auction: { status: string | null; startPrice: number | null; currentBid: number | null; endsAt: string | null };
  jobAddress: string | null;
  jobStartISO: string | null;
  totalValue: number;
  assignedContractorId: string | null;
  contractorAcceptance: string | null;
};

const gbp = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function useCountdown(endsAt: string | null): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  if (!endsAt) return "";
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return "closing…";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function JobBidsPanel({
  jobId,
  bids,
  auction,
  jobAddress,
  jobStartISO,
  totalValue,
  assignedContractorId,
  contractorAcceptance,
}: Props) {
  const [pending, start] = useTransition();
  const [showPicker, setShowPicker] = useState(false);
  const [showAuction, setShowAuction] = useState(false);
  const [cards, setCards] = useState<ContractorCard[] | null>(null);
  const [loadingCards, loadStart] = useTransition();
  const [q, setQ] = useState("");
  const [startPrice, setStartPrice] = useState(Math.round(totalValue * 0.6) || 0);
  const [durationMins, setDurationMins] = useState(5);

  const isLive = auction.status === AUCTION.LIVE;
  const countdown = useCountdown(isLive ? auction.endsAt : null);

  // On mount for a live auction, lazily resolve if the countdown has already
  // elapsed (resolve-on-load fallback — §3).
  useEffect(() => {
    if (isLive && auction.endsAt && new Date(auction.endsAt).getTime() <= Date.now()) {
      start(async () => {
        await resolveAuction(jobId);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadCards() {
    setShowPicker((s) => !s);
    if (cards === null) {
      loadStart(async () => setCards(await getContractorPickerData(jobAddress, jobStartISO)));
    }
  }

  function autoInvite() {
    start(async () => {
      const r = await inviteContractorsForJob(jobId);
      if ("error" in r) toast.error(r.error);
      else toast.success(r.invited > 0 ? `Invited ${r.invited} contractor(s)` : "No new covering contractors to invite");
    });
  }

  function inviteOne(contractorId: string) {
    start(async () => {
      const r = await inviteContractorsForJob(jobId, [contractorId]);
      if ("error" in r) toast.error(r.error);
      else toast.success(r.invited > 0 ? "Invite sent" : "Already invited");
    });
  }

  function assign(contractorId: string) {
    start(async () => {
      const r = await assignContractorFromBid(jobId, contractorId);
      if ("error" in r) toast.error(r.error);
      else toast.success("Contractor assigned");
    });
  }

  function openAuction() {
    if (!(startPrice >= 0)) return toast.error("Enter a starting bid");
    start(async () => {
      const r = await createAuction(jobId, startPrice, durationMins);
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Auction opened — covering contractors invited");
        setShowAuction(false);
      }
    });
  }

  function doResolve() {
    start(async () => {
      const r = await resolveAuction(jobId);
      if ("error" in r) toast.error(r.error);
      else toast.success(r.resolved ? "Auction resolved" : "Nothing to resolve yet");
    });
  }

  const invitedIds = new Set(bids.map((b) => b.contractor_id));
  const filtered = (cards ?? []).filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Contractor Invites &amp; Auction
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={autoInvite} disabled={pending}>
            <Users className="size-4" /> Auto-Invite (Covering)
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={loadCards} disabled={pending}>
            <UserPlus className="size-4" /> Invite Specific
          </Button>
          {!isLive && (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAuction((s) => !s)} disabled={pending}>
              <Gavel className="size-4" /> Start Auction
            </Button>
          )}
        </div>
      </div>

      {/* Assigned banner */}
      {assignedContractorId && (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm flex items-center justify-between">
          <span>Contractor assigned</span>
          <Badge variant={contractorAcceptance === "accepted" ? "default" : contractorAcceptance === "rejected" ? "destructive" : "secondary"} className="capitalize">
            {contractorAcceptance ?? "pending"}
          </Badge>
        </div>
      )}

      {/* Live auction status */}
      {isLive && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-amber-800 dark:text-amber-200 inline-flex items-center gap-1.5">
              <Gavel className="size-4" /> Auction live
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-amber-800 dark:text-amber-200">
              <Clock className="size-3.5" /> {countdown}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Start {gbp(auction.startPrice ?? 0)}</span>
            <span className="font-semibold">Current {gbp(auction.currentBid ?? 0)}</span>
          </div>
          <Button type="button" size="xs" variant="outline" onClick={doResolve} disabled={pending}>
            Resolve now
          </Button>
        </div>
      )}
      {auction.status === AUCTION.WON && (
        <p className="text-sm text-emerald-600">Auction won — winning bid {gbp(auction.currentBid ?? 0)}.</p>
      )}
      {auction.status === AUCTION.NO_BIDS && (
        <p className="text-sm text-muted-foreground">Auction closed with no bids.</p>
      )}

      {/* Start-auction form */}
      {showAuction && !isLive && (
        <div className="rounded-lg border p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Starting Bid (£)</label>
              <Input type="number" min={0} value={startPrice} onChange={(e) => setStartPrice(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Duration (mins)</label>
              <Input type="number" min={1} value={durationMins} onChange={(e) => setDurationMins(Number(e.target.value) || 5)} />
            </div>
          </div>
          <Button type="button" size="sm" onClick={openAuction} disabled={pending}>Open Auction</Button>
        </div>
      )}

      {/* Invite-specific picker */}
      {showPicker && (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contractors…" className="pl-8" />
          </div>
          {loadingCards || cards === null ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Loading…</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {filtered.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 border-b last:border-0 pb-1.5 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <div className="flex gap-1.5 flex-wrap mt-0.5">
                      <Badge variant={c.covers ? "default" : "outline"} className="text-[10px]">
                        {c.covers ? "Covers this area" : "Outside coverage"}
                      </Badge>
                      {invitedIds.has(c.id) && <Badge variant="secondary" className="text-[10px]">Already invited</Badge>}
                      {c.licenceType === "licenced" && <Badge variant="outline" className="text-[10px]">Licenced</Badge>}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    disabled={pending || invitedIds.has(c.id)}
                    onClick={() => inviteOne(c.id)}
                  >
                    Invite
                  </Button>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground">No contractors.</p>}
            </div>
          )}
        </div>
      )}

      {/* Bid list */}
      {bids.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contractors invited yet.</p>
      ) : (
        <ul className="space-y-2">
          {bids.map((b) => (
            <li key={b.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-2 last:pb-0">
              <div className="min-w-0 text-sm">
                <p className="font-medium">{b.contractor_name ?? "Contractor"}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge
                    variant={b.status === "interested" ? "default" : b.status === "declined" ? "destructive" : "secondary"}
                    className="text-[10px] capitalize"
                  >
                    {b.status}
                  </Badge>
                  {b.is_auction_bid && b.bid_amount != null && (
                    <span className="text-xs">Bid {gbp(b.bid_amount)}</span>
                  )}
                  {!b.is_auction_bid && b.proposed_price != null && (
                    <span className="text-xs">Proposed {gbp(b.proposed_price)}</span>
                  )}
                </div>
                {b.note && <p className="text-xs text-muted-foreground italic mt-0.5">{b.note}</p>}
              </div>
              {b.status === "interested" && !assignedContractorId && (
                <Button type="button" size="xs" onClick={() => assign(b.contractor_id)} disabled={pending}>
                  Assign
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
