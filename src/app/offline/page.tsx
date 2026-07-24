import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 gap-3">
      <WifiOff className="size-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        This page isn&apos;t cached. Any check-ins or sign-offs you make on jobs
        you&apos;ve already opened are saved and will sync automatically when
        you&apos;re back online.
      </p>
    </div>
  );
}
