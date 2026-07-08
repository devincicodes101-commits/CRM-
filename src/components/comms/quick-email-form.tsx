"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendCustomerEmail } from "@/app/(protected)/comms/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function QuickEmailForm() {
  const [to, setTo] = useState("");
  const [toName, setToName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setTo(""); setToName(""); setSubject(""); setBody("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error("Email, subject and body are required");
      return;
    }
    startTransition(async () => {
      const result = await sendCustomerEmail({ to, toName, subject, body });
      if (result?.error) toast.error(result.error);
      else { toast.success("Email sent"); reset(); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Recipient name</Label>
          <Input
            value={toName}
            onChange={(e) => setToName(e.target.value)}
            placeholder="John Smith"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email address *</Label>
          <Input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="john@example.com"
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Subject *</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Your appointment confirmation"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Message *</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Write your message…"
          className="text-sm resize-none"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send Email"}
      </Button>
    </form>
  );
}