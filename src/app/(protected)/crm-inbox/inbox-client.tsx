"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { Inbox, Send, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { replyInInbox, markInboxRead } from "./actions";

export type InboxConversation = {
  key: string;
  conversationId: string | null;
  customerName: string;
  customerEmail: string;
  subject: string | null;
  messages: { id: string; content: string; sender_type: string; created_date: string }[];
  latest: string;
  unread: number;
  status: string;
};

export function InboxClient({ conversations }: { conversations: InboxConversation[] }) {
  const router = useRouter();
  const [activeKey, setActiveKey] = useState<string | null>(conversations[0]?.key ?? null);
  const [reply, setReply] = useState("");
  const [pending, start] = useTransition();

  const active = conversations.find((c) => c.key === activeKey) ?? null;

  // Mark the opened conversation's incoming messages as read.
  useEffect(() => {
    if (active && active.unread > 0) {
      markInboxRead(active.conversationId, active.customerEmail).then(() => router.refresh());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  function send() {
    if (!reply.trim() || !active) return;
    const text = reply;
    setReply("");
    start(async () => {
      const res = await replyInInbox({
        conversationId: active.conversationId,
        customerEmail: active.customerEmail,
        customerName: active.customerName,
        content: text,
      });
      if ("error" in res) toast.error(res.error);
      else { toast.success("Reply sent"); router.refresh(); }
    });
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Conversation list */}
      <div className="w-80 border-r flex flex-col bg-card shrink-0">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <Inbox className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Inbox</h2>
          <span className="ml-auto text-xs text-muted-foreground">{conversations.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No customer messages yet.</p>
          ) : conversations.map((c) => (
            <button key={c.key} onClick={() => setActiveKey(c.key)}
              className={cn("w-full text-left px-4 py-3 border-b transition-colors", activeKey === c.key ? "bg-primary/5" : "hover:bg-muted/50")}>
              <div className="flex items-center justify-between gap-2">
                <span className={cn("text-sm truncate", c.unread > 0 ? "font-semibold" : "font-medium")}>{c.customerName}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(c.latest), { addSuffix: true })}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {c.subject ? `${c.subject} · ` : ""}{c.messages[c.messages.length - 1]?.content}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {c.unread > 0 && <span className="text-[10px] rounded-full bg-primary text-white px-1.5">{c.unread} new</span>}
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full capitalize", c.status === "open" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700")}>{c.status}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Mail className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">Select a conversation to read and reply.</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b bg-card">
              <p className="font-semibold">{active.customerName}</p>
              <p className="text-xs text-muted-foreground">{active.customerEmail}{active.subject ? ` · ${active.subject}` : ""}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {active.messages.map((m) => {
                const admin = m.sender_type === "admin";
                return (
                  <div key={m.id} className={cn("max-w-[80%]", admin && "ml-auto")}>
                    <div className={cn("rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap", admin ? "bg-primary text-white rounded-tr-sm" : "bg-muted rounded-tl-sm")}>
                      {m.content}
                    </div>
                    <p className={cn("text-[11px] text-muted-foreground mt-1", admin && "text-right")}>
                      {admin ? "You" : active.customerName} · {format(new Date(m.created_date), "d MMM, HH:mm")}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t bg-card flex items-end gap-2">
              <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Type a reply…" rows={2} disabled={pending}
                className="flex-1 rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button onClick={send} disabled={pending || !reply.trim()}
                className="size-9 rounded-md bg-primary text-white flex items-center justify-center disabled:opacity-50 shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
