"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { sendTestEmail } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TestEmailButton({ defaultTo }: { defaultTo: string }) {
  const [to, setTo] = useState(defaultTo);
  const [pending, start] = useTransition();

  function send() {
    start(async () => {
      const res = await sendTestEmail(to);
      if ("error" in res) toast.error(res.error);
      else toast.success(`Test email sent to ${to}`);
    });
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Mail className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">Email delivery</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Send a test email to confirm Resend is connected.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="you@example.com"
          type="email"
        />
        <Button onClick={send} disabled={pending} className="shrink-0">
          {pending ? "Sending…" : "Send test"}
        </Button>
      </div>
    </div>
  );
}
