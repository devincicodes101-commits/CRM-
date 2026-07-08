"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendSMS } from "@/app/(protected)/comms/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function QuickSmsForm() {
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const remaining = 160 - body.length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim() || !body.trim()) {
      toast.error("Phone number and message are required");
      return;
    }
    startTransition(async () => {
      const result = await sendSMS(to.trim(), body.trim());
      if (result?.error) toast.error(result.error);
      else { toast.success("SMS sent"); setTo(""); setBody(""); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Phone number *</Label>
        <Input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="+447700123456"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <Label className="text-xs">Message *</Label>
          <span className={`text-xs ${remaining < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {remaining} chars
          </span>
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={320}
          placeholder="Hi {name}, your appointment is confirmed for…"
          className="text-sm resize-none"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send SMS"}
      </Button>
    </form>
  );
}