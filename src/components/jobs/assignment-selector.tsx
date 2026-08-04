"use client";

import { useState, useTransition, useEffect } from "react";
import { Star, MapPin, ShieldCheck, ShieldAlert, CalendarClock, Gavel, User, HardHat, Loader2 } from "lucide-react";
import { getContractorPickerData, type ContractorCard } from "@/app/(protected)/jobs/picker-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Assignment =
  | { mode: "operative"; operative: string | null }
  | { mode: "contractor"; contractorId: string | null; payPercent: number | null }
  | { mode: "auction"; startPrice: number; durationMins: number };

type OperativeOption = { id: string; full_name: string };

type Props = {
  operatives: OperativeOption[];
  jobPostcodeSource: string | null; // address; postcode extracted server-side
  jobDateISO: string | null;
  totalValue: number;
  value: Assignment;
  onChange: (a: Assignment) => void;
};

const MODES = [
  { key: "operative", label: "Operative", icon: User, hint: "Internal team, hourly" },
  { key: "contractor", label: "Contractor", icon: HardHat, hint: "External, % of job value" },
  { key: "auction", label: "Auction", icon: Gavel, hint: "Let contractors bid" },
] as const;

// §6 ContractorSmartPicker — one card per contractor with the assignment signals.
function ContractorCardView({
  c,
  selected,
  onSelect,
}: {
  c: ContractorCard;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-lg border p-3 transition-colors ${
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{c.name}</span>
        {c.licenceType === "licenced" && (
          <span className="text-[10px] uppercase tracking-wide rounded bg-blue-100 text-blue-700 px-1.5 py-0.5">Licenced</span>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
        <span className="inline-flex items-center gap-1">
          <Star className={`size-3 ${c.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
          {c.rating ? `${c.rating} (${c.ratingCount})` : "Not rated yet"}
        </span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <MapPin className="size-3" />
          {c.covers
            ? c.distanceMiles != null
              ? `${c.distanceMiles} mi · covers`
              : "Covers area"
            : "Outside coverage"}
        </span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <CalendarClock className="size-3" />
          {c.availableOnDate ? "Available" : "Busy that day"}
        </span>
        {c.insuranceValid ? (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <ShieldCheck className="size-3" /> Insured
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-600" title={c.insuranceIssues.join(", ")}>
            <ShieldAlert className="size-3" /> {c.insuranceIssues.length ? `Expired: ${c.insuranceIssues[0]}` : "Insurance"}
          </span>
        )}
        {c.completionPct != null && (
          <span className="text-muted-foreground">{c.completionPct}% completion</span>
        )}
      </div>
    </button>
  );
}

export function AssignmentSelector({
  operatives,
  jobPostcodeSource,
  jobDateISO,
  totalValue,
  value,
  onChange,
}: Props) {
  const [cards, setCards] = useState<ContractorCard[] | null>(null);
  const [loading, startLoad] = useTransition();

  const needsCards = value.mode === "contractor" || value.mode === "auction";

  useEffect(() => {
    if (!needsCards || cards !== null) return;
    startLoad(async () => {
      const data = await getContractorPickerData(jobPostcodeSource, jobDateISO);
      setCards(data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsCards]);

  function reloadCards() {
    setCards(null);
    startLoad(async () => {
      const data = await getContractorPickerData(jobPostcodeSource, jobDateISO);
      setCards(data);
    });
  }

  const coveringCount = cards?.filter((c) => c.covers).length ?? 0;
  const payPercent = value.mode === "contractor" ? value.payPercent : null;
  const payAmount =
    payPercent != null ? Math.round(((totalValue * payPercent) / 100) * 100) / 100 : null;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Assignment</h2>

      <div className="grid grid-cols-3 gap-2">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = value.mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                if (m.key === "operative") onChange({ mode: "operative", operative: null });
                else if (m.key === "contractor") onChange({ mode: "contractor", contractorId: null, payPercent: 20 });
                else onChange({ mode: "auction", startPrice: Math.round(totalValue * 0.6) || 0, durationMins: 5 });
              }}
              className={`rounded-lg border p-3 text-center transition-colors ${
                active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"
              }`}
            >
              <Icon className={`size-5 mx-auto mb-1 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-sm font-medium">{m.label}</div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{m.hint}</div>
            </button>
          );
        })}
      </div>

      {/* Operative */}
      {value.mode === "operative" && (
        <div className="space-y-1.5">
          <Label>Assign Operative</Label>
          {operatives.length > 0 ? (
            <Select
              value={value.operative ?? ""}
              onValueChange={(v) => onChange({ mode: "operative", operative: v || null })}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select operative…" /></SelectTrigger>
              <SelectContent>
                {operatives.map((o) => (
                  <SelectItem key={o.id} value={o.full_name}>{o.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={value.operative ?? ""}
              onChange={(e) => onChange({ mode: "operative", operative: e.target.value || null })}
              placeholder="Name or team"
            />
          )}
        </div>
      )}

      {/* Contractor */}
      {value.mode === "contractor" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Choose Contractor</Label>
            <button type="button" onClick={reloadCards} className="text-xs text-primary hover:underline">
              Refresh
            </button>
          </div>
          {loading || cards === null ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Loading contractors…</p>
          ) : cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contractors on file.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {cards.map((c) => (
                <ContractorCardView
                  key={c.id}
                  c={c}
                  selected={value.contractorId === c.id}
                  onSelect={() => onChange({ mode: "contractor", contractorId: c.id, payPercent })}
                />
              ))}
            </div>
          )}
          {value.contractorId && (
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="payPercent">% of job value to contractor</Label>
                <Input
                  id="payPercent"
                  type="number"
                  min={0}
                  max={100}
                  value={payPercent ?? ""}
                  onChange={(e) =>
                    onChange({
                      mode: "contractor",
                      contractorId: value.contractorId,
                      payPercent: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground pb-2">
                {payAmount != null ? `≈ £${payAmount.toFixed(2)} to contractor` : "Set a % to compute share"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Auction */}
      {value.mode === "auction" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startPrice">Starting Bid (£)</Label>
              <Input
                id="startPrice"
                type="number"
                min={0}
                value={value.startPrice}
                onChange={(e) => onChange({ mode: "auction", startPrice: Number(e.target.value) || 0, durationMins: value.durationMins })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="durationMins">Duration (mins)</Label>
              <Input
                id="durationMins"
                type="number"
                min={1}
                value={value.durationMins}
                onChange={(e) => onChange({ mode: "auction", startPrice: value.startPrice, durationMins: Number(e.target.value) || 5 })}
              />
            </div>
          </div>
          {cards !== null && (
            <p className={`text-sm ${coveringCount === 0 ? "text-amber-600" : "text-muted-foreground"}`}>
              {loading
                ? "Checking coverage…"
                : coveringCount === 0
                  ? "⚠ No contractors cover this area — an auction would have no bidders."
                  : `${coveringCount} contractor${coveringCount === 1 ? "" : "s"} cover this area and will be invited to bid.`}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            On save, the job is created as a live auction and covering contractors are emailed to bid.
          </p>
        </div>
      )}
    </div>
  );
}
