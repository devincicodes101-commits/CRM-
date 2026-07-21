"use client";

import { useTransition } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { sendHighValueReminders } from "./actions";
import { Button } from "@/components/ui/button";

export function SendRemindersButton() {
  const [pending, start] = useTransition();
  function send() {
    start(async () => {
      const res = await sendHighValueReminders();
      if ("error" in res) toast.error(res.error);
      else toast.success(res.sent > 0 ? `Sent ${res.sent} reminder${res.sent > 1 ? "s" : ""}` : "No reminders needed");
    });
  }
  return (
    <Button onClick={send} disabled={pending}>
      <Mail className="size-4" /> {pending ? "Sending…" : "Send Weekly Reminder Emails"}
    </Button>
  );
}
