"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { postOfficeMessage } from "@/app/(protected)/jobs/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type JobMessage = {
  id: string;
  sender_role: string | null;
  sender_name: string | null;
  body: string;
  created_date: string;
};

const ROLE_LABEL: Record<string, string> = { office: "Office", contractor: "Contractor", client: "Customer" };

export function JobMessagesPanel({ jobId, messages }: { jobId: string; messages: JobMessage[] }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  function send() {
    if (!text.trim()) return;
    start(async () => {
      const res = await postOfficeMessage(jobId, text);
      if ("error" in res) toast.error(res.error);
      else { setText(""); toast.success("Reply sent"); }
    });
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="px-5 py-4 border-b font-semibold text-sm">Messages (customer thread)</div>
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No messages yet.</p>
        ) : messages.map((m) => {
          const office = m.sender_role === "office";
          return (
            <div key={m.id} className={cn("max-w-[85%]", office && "ml-auto")}>
              <div className={cn("rounded-2xl px-3 py-2 text-sm", office ? "bg-primary text-white rounded-tr-sm" : "bg-muted rounded-tl-sm")}>
                {m.body}
              </div>
              <p className={cn("text-[11px] text-muted-foreground mt-1", office && "text-right")}>
                {m.sender_name ?? ROLE_LABEL[m.sender_role ?? ""] ?? "—"}
                {m.created_date ? ` · ${format(new Date(m.created_date), "d MMM, HH:mm")}` : ""}
              </p>
            </div>
          );
        })}
      </div>
      <div className="border-t p-3 flex items-end gap-2">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Reply to the customer…" className="text-sm" />
        <Button size="icon" disabled={pending || !text.trim()} onClick={send} title="Send">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
