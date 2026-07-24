"use client";

import { useState, useTransition } from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { lookupAddresses } from "@/lib/actions/address";

// Postcode → address picker. On select, calls onSelect with the full address string.
export function PostcodeLookup({ onSelect }: { onSelect: (address: string) => void }) {
  const [postcode, setPostcode] = useState("");
  const [addresses, setAddresses] = useState<string[] | null>(null);
  const [pending, start] = useTransition();

  function search() {
    if (!postcode.trim()) return;
    start(async () => {
      const res = await lookupAddresses(postcode);
      if ("error" in res) {
        toast.error(res.error);
        setAddresses(null);
      } else if (res.addresses.length === 0) {
        toast.error("No addresses found for that postcode");
        setAddresses([]);
      } else {
        setAddresses(res.addresses);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }}
            placeholder="Enter postcode e.g. SW1A 1AA"
            className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={search}
          disabled={pending || !postcode.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary text-white px-4 text-sm disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Lookup
        </button>
      </div>

      {addresses && addresses.length > 0 && (
        <div className="rounded-md border max-h-52 overflow-y-auto divide-y">
          {addresses.map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onSelect(a); setAddresses(null); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
            >
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
