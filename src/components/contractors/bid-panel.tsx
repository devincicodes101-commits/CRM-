"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Check, X } from "lucide-react";
import { submitBid, acceptBid, rejectBid } from "@/app/(protected)/contractors/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { JobBid, Subcontractor } from "@/lib/schemas/contractors";

type Props = {
  jobId: string;
  bids: JobBid[];
  subcontractors: Subcontractor[];
  canManage: boolean;
};

const STATUS_VARIANT = {
  pending: "secondary",
  accepted: "default",
  rejected: "destructive",
  withdrawn: "outline",
} as const;

export function BidPanel({ jobId, bids, subcontractors, canManage }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [subId, setSubId] = useState("");
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!subId || isNaN(amt) || amt <= 0) {
      toast.error("Select a subcontractor and enter a valid amount");
      return;
    }
    startTransition(async () => {
      const result = await submitBid(
        jobId,
        subId,
        amt,
        notes,
        days ? parseInt(days) : undefined
      );
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Bid submitted");
        setShowForm(false);
        setSubId(""); setAmount(""); setDays(""); setNotes("");
      }
    });
  }

  function handleAccept(bid: JobBid) {
    startTransition(async () => {
      const result = await acceptBid(bid.id, jobId, bid.subcontractor_id);
      if (result?.error) toast.error(result.error);
      else toast.success("Bid accepted — subcontractor assigned to job");
    });
  }

  function handleReject(bidId: string) {
    startTransition(async () => {
      const result = await rejectBid(bidId, jobId);
      if (result?.error) toast.error(result.error);
      else toast.success("Bid rejected");
    });
  }

  return (
    <div className="space-y-4">
      {/* Existing bids */}
      {bids.length === 0 && (
        <p className="text-sm text-muted-foreground">No bids submitted yet.</p>
      )}
      {bids.map((bid) => (
        <div key={bid.id} className="rounded-lg border bg-card p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{bid.subcontractor_name ?? "Unknown"}</p>
              {bid.subcontractor_company && (
                <p className="text-xs text-muted-foreground">{bid.subcontractor_company}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold text-sm">£{Number(bid.amount).toFixed(2)}</span>
              <Badge
                variant={STATUS_VARIANT[bid.status as keyof typeof STATUS_VARIANT] ?? "outline"}
                className="text-xs capitalize"
              >
                {bid.status}
              </Badge>
            </div>
          </div>
          {bid.estimated_days && (
            <p className="text-xs text-muted-foreground">Est. {bid.estimated_days} days</p>
          )}
          {bid.notes && <p className="text-xs text-muted-foreground italic">{bid.notes}</p>}
          {canManage && bid.status === "pending" && (
            <div className="flex gap-2 pt-1">
              <Button
                size="xs"
                onClick={() => handleAccept(bid)}
                disabled={pending}
              >
                <Check className="size-3" /> Accept
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => handleReject(bid.id)}
                disabled={pending}
              >
                <X className="size-3" /> Reject
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Submit bid form */}
      {canManage && (
        <>
          {!showForm ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              <Plus className="size-3.5" /> Submit Bid
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <h3 className="text-sm font-medium">New Bid</h3>
              <div className="space-y-1.5">
                <Label>Subcontractor</Label>
                <Select value={subId} onValueChange={(v) => setSubId(v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {subcontractors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}{s.company_name ? ` — ${s.company_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bid-amount">Amount (£)</Label>
                  <Input
                    id="bid-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bid-days">Est. Days</Label>
                  <Input
                    id="bid-days"
                    type="number"
                    min="1"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bid-notes">Notes</Label>
                <Textarea
                  id="bid-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional notes…"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Submitting…" : "Submit"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
