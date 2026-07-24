"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WifiOff } from "lucide-react";
import { getQueue, removeFromQueue, queueSize } from "@/lib/offline-queue";
import { checkIn, checkOut, completeJobFromField } from "@/app/(protected)/field/actions";

// Mounted on field routes: registers the service worker, shows an offline
// banner, and replays queued actions when the device comes back online.
export function OfflineBoot() {
  const router = useRouter();
  const [offline, setOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    setOffline(!navigator.onLine);
    setPendingCount(queueSize());

    async function sync() {
      setOffline(false);
      const queue = getQueue();
      if (queue.length === 0) return;
      let synced = 0;
      for (const item of queue) {
        try {
          if (item.type === "checkin") await checkIn(item.jobId, item.lat, item.lng);
          else if (item.type === "checkout") await checkOut(item.jobId);
          else if (item.type === "complete") await completeJobFromField(item.jobId, item.notes);
          removeFromQueue(item.id);
          synced++;
        } catch {
          break; // stop on first failure; retry next time we're online
        }
      }
      setPendingCount(queueSize());
      if (synced > 0) {
        toast.success(`Synced ${synced} offline ${synced === 1 ? "update" : "updates"}`);
        router.refresh();
      }
    }

    function goOffline() { setOffline(true); }
    window.addEventListener("online", sync);
    window.addEventListener("offline", goOffline);
    if (navigator.onLine) sync();
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!offline && pendingCount === 0) return null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 px-3 py-2 flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
      <WifiOff className="size-4 shrink-0" />
      {offline
        ? "You're offline — check-ins and sign-offs are saved and will sync automatically."
        : `Syncing ${pendingCount} offline ${pendingCount === 1 ? "update" : "updates"}…`}
    </div>
  );
}
