"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MapPin, LogOut, Loader2 } from "lucide-react";
import { checkIn, checkOut } from "@/app/(protected)/field/actions";
import { Button } from "@/components/ui/button";

type Props = {
  jobId: string;
  checkedIn: boolean;
  checkedOut: boolean;
};

export function CheckInButton({ jobId, checkedIn, checkedOut }: Props) {
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);

  function handleCheckIn() {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        startTransition(async () => {
          const result = await checkIn(jobId, pos.coords.latitude, pos.coords.longitude);
          if (result?.error) toast.error(result.error);
          else toast.success("Checked in — job marked In Progress");
        });
      },
      (err) => {
        setLocating(false);
        toast.error(`Location error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleCheckOut() {
    startTransition(async () => {
      const result = await checkOut(jobId);
      if (result?.error) toast.error(result.error);
      else toast.success("Checked out");
    });
  }

  if (checkedOut) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LogOut className="size-4" />
        Checked out
      </div>
    );
  }

  if (checkedIn) {
    return (
      <Button variant="outline" size="sm" onClick={handleCheckOut} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
        Check Out
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleCheckIn} disabled={pending || locating}>
      {locating ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <MapPin className="size-4" />
      )}
      {locating ? "Getting location…" : pending ? "Checking in…" : "Check In"}
    </Button>
  );
}