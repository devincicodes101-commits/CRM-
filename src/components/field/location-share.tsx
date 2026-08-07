"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Navigation, NavigationOff } from "lucide-react";
import { updateOperativeLocation } from "@/app/(protected)/fleet/actions";

// §7 — lets an operative share their live location so the office sees the van on
// the fleet map and gets an "approaching site" alert. Posts at most every ~30s.
export function LocationShare() {
  const [sharing, setSharing] = useState(false);
  const watchId = useRef<number | null>(null);
  const lastSent = useRef(0);

  useEffect(() => {
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  function start() {
    if (!("geolocation" in navigator)) {
      toast.error("Location isn't available on this device");
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent.current < 30_000) return; // throttle to 30s
        lastSent.current = now;
        const { latitude, longitude, speed } = pos.coords;
        updateOperativeLocation(latitude, longitude, speed ? Math.round(speed * 2.237) : 0).then((r) => {
          if ("skipped" in r && r.skipped === "no_vehicle") {
            toast.message("No vehicle is assigned to you — location not tracked.");
          }
        });
      },
      () => toast.error("Couldn't get your location — check permissions"),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );
    setSharing(true);
    toast.success("Sharing your location with the office");
  }

  function stop() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setSharing(false);
    toast.message("Stopped sharing location");
  }

  return (
    <button
      type="button"
      onClick={sharing ? stop : start}
      className={`w-full inline-flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-colors ${
        sharing
          ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
          : "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
      }`}
    >
      {sharing ? <Navigation className="size-4 animate-pulse" /> : <NavigationOff className="size-4" />}
      {sharing ? "Sharing location — tap to stop" : "Share my location"}
    </button>
  );
}
