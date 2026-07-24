// Client-side offline queue for critical field actions. When the device is
// offline, the field components enqueue the action here (localStorage) instead
// of calling the server; OfflineBoot replays them on reconnect.

export type QueuedAction =
  | { id: string; type: "checkin"; jobId: string; lat: number; lng: number; ts: number }
  | { id: string; type: "checkout"; jobId: string; ts: number }
  | { id: string; type: "complete"; jobId: string; notes: string; ts: number };

const KEY = "bs_offline_queue";

export function getQueue(): QueuedAction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as QueuedAction[];
  } catch {
    return [];
  }
}

function save(q: QueuedAction[]) {
  localStorage.setItem(KEY, JSON.stringify(q));
}

export type NewQueuedAction =
  | { type: "checkin"; jobId: string; lat: number; lng: number }
  | { type: "checkout"; jobId: string }
  | { type: "complete"; jobId: string; notes: string };

export function enqueue(action: NewQueuedAction) {
  const q = getQueue();
  q.push({ ...action, id: crypto.randomUUID(), ts: Date.now() });
  save(q);
}

export function removeFromQueue(id: string) {
  save(getQueue().filter((a) => a.id !== id));
}

export function queueSize(): number {
  return getQueue().length;
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}
