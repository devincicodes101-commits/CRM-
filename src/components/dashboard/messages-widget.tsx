"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MessageSquare, Send, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { replyToMessage } from "@/app/(protected)/dashboard/actions";

export type MessageRow = {
  id: string;
  conversation_id: string | null;
  customer_name: string;
  customer_email: string;
  subject: string | null;
  content: string;
  sender_type: "customer" | "admin";
  created_date: string;
};

type Conversation = {
  key: string;
  customerName: string;
  customerEmail: string;
  subject: string | null;
  messages: MessageRow[];
  latest: string;
};

function groupConversations(messages: MessageRow[]): Conversation[] {
  const map = new Map<string, Conversation>();
  for (const m of messages) {
    const key = m.conversation_id ?? m.id;
    const existing = map.get(key);
    if (existing) {
      existing.messages.push(m);
      if (m.created_date > existing.latest) existing.latest = m.created_date;
    } else {
      map.set(key, {
        key,
        customerName: m.customer_name,
        customerEmail: m.customer_email,
        subject: m.subject,
        messages: [m],
        latest: m.created_date,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.latest.localeCompare(a.latest));
}

export function MessagesWidget({ messages }: { messages: MessageRow[] }) {
  const conversations = groupConversations(messages);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [pending, startTransition] = useTransition();

  if (conversations.length === 0) return null;

  function handleReply(convo: Conversation) {
    startTransition(async () => {
      const res = await replyToMessage({
        conversationId: convo.messages[0].conversation_id,
        customerEmail: convo.customerEmail,
        customerName: convo.customerName,
        content: reply,
      });
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Reply sent");
        setReply("");
        setOpenKey(null);
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 px-5 py-4 border-b font-semibold text-sm">
        <MessageSquare className="h-4 w-4 text-blue-500" />
        Customer Messages
        <span className="ml-auto text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5">
          {conversations.length} open
        </span>
      </div>
      <ul className="divide-y">
        {conversations.map((convo) => {
          const isOpen = openKey === convo.key;
          return (
            <li key={convo.key} className="px-5 py-3">
              <button
                className="w-full flex items-center justify-between text-left"
                onClick={() => setOpenKey(isOpen ? null : convo.key)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {convo.customerName}
                    {convo.subject ? ` · ${convo.subject}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {convo.messages.length} message{convo.messages.length > 1 ? "s" : ""} ·{" "}
                    {formatDistanceToNow(new Date(convo.latest), { addSuffix: true })}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {isOpen && (
                <div className="mt-3 space-y-2">
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {convo.messages
                      .slice()
                      .sort((a, b) => a.created_date.localeCompare(b.created_date))
                      .map((m) => (
                        <div
                          key={m.id}
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm max-w-[85%]",
                            m.sender_type === "admin"
                              ? "ml-auto bg-green-100 dark:bg-green-900/30"
                              : "bg-blue-100 dark:bg-blue-900/30"
                          )}
                        >
                          {m.content}
                        </div>
                      ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type a reply…"
                      rows={2}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      disabled={pending || !reply.trim()}
                      onClick={() => handleReply(convo)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
