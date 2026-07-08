"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Reply } from "lucide-react";
import { markMessageRead, replyToMessage } from "@/app/(protected)/comms/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/schemas/comms";

export function MessageThread({ message: m }: { message: Message }) {
  const [open, setOpen] = useState(!m.is_read && m.sender_type === "customer");
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [pending, startTransition] = useTransition();

  function handleOpen() {
    if (!open && !m.is_read && m.sender_type === "customer") {
      startTransition(() => markMessageRead(m.id));
    }
    setOpen((p) => !p);
  }

  function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    startTransition(async () => {
      const result = await replyToMessage(m.id, replyText, m.customer_email, m.customer_name);
      if (result?.error) toast.error(result.error);
      else { toast.success("Reply sent"); setReplying(false); setReplyText(""); }
    });
  }

  const isInbound = m.sender_type === "customer";
  const isUnread = !m.is_read && isInbound;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-colors",
        isUnread && "border-primary/50"
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {isUnread && (
            <span className="size-2 rounded-full bg-primary shrink-0" />
          )}
          <div className="min-w-0">
            <span className="font-medium text-sm">{m.customer_name}</span>
            <span className="text-muted-foreground text-xs ml-2">{m.customer_email}</span>
            {m.subject && (
              <p className="text-xs text-muted-foreground truncate">{m.subject}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <Badge variant={m.status === "answered" ? "default" : "secondary"} className="text-xs capitalize">
            {m.status}
          </Badge>
          <Badge variant={isInbound ? "outline" : "secondary"} className="text-xs">
            {isInbound ? "Inbound" : "Outbound"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(m.created_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
          {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t">
          <p className="text-sm whitespace-pre-wrap mt-3">{m.content}</p>

          {isInbound && m.status !== "answered" && (
            <div>
              {!replying ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReplying(true)}
                >
                  <Reply className="size-3.5" /> Reply
                </Button>
              ) : (
                <form onSubmit={handleReply} className="space-y-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    placeholder="Write your reply…"
                    className="text-sm resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={pending}>
                      {pending ? "Sending…" : "Send Reply"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setReplying(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}