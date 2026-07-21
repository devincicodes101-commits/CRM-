"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Bot, Send, Plus, MessageSquare, Clock, User, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendTelesalesMessage, createTelesalesConversation } from "./actions";

type Convo = { id: string; name: string; created_date: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Active = { id: string; name: string; messages: any[] } | null;

// Render the stored Anthropic-format messages into chat bubbles.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderMessages(messages: any[]) {
  const out: { key: string; who: "user" | "agent" | "tool"; text: string }[] = [];
  messages.forEach((m, i) => {
    if (m.role === "user" && typeof m.content === "string") {
      out.push({ key: `u${i}`, who: "user", text: m.content });
    } else if (m.role === "assistant" && Array.isArray(m.content)) {
      m.content.forEach((b: { type: string; text?: string; name?: string }, j: number) => {
        if (b.type === "text" && b.text) out.push({ key: `a${i}-${j}`, who: "agent", text: b.text });
        else if (b.type === "tool_use") out.push({ key: `t${i}-${j}`, who: "tool", text: b.name ?? "tool" });
      });
    }
    // user messages with array content are tool_results — internal, not shown
  });
  return out;
}

export function TelesalesConsole({ conversations, active }: { conversations: Convo[]; active: Active }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  const bubbles = active ? renderMessages(active.messages ?? []) : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  function newConversation() {
    start(async () => {
      const res = await createTelesalesConversation(`Session ${format(new Date(), "dd MMM HH:mm")}`);
      if ("error" in res) toast.error(res.error);
      else router.push(`/telesales-agent?c=${res.id}`);
    });
  }

  function send() {
    if (!input.trim() || !active) return;
    const text = input.trim();
    setInput("");
    start(async () => {
      const res = await sendTelesalesMessage(active.id, text);
      if ("error" in res) toast.error(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar */}
      <div className="w-72 border-r flex flex-col bg-card shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">AI Telesales Agent</h2>
              <p className="text-xs text-muted-foreground">After-hours assistant</p>
            </div>
          </div>
          <button onClick={newConversation} disabled={pending}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-white text-sm py-2 font-medium disabled:opacity-50">
            <Plus className="w-4 h-4" /> New Conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No conversations yet. Start one!</p>
          ) : conversations.map((c) => (
            <button key={c.id} onClick={() => router.push(`/telesales-agent?c=${c.id}`)}
              className={cn("w-full text-left rounded-lg px-3 py-2 transition-colors",
                active?.id === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted")}>
              <div className="flex items-center gap-1.5 text-sm font-medium truncate">
                <MessageSquare className="w-3.5 h-3.5 shrink-0" /> {c.name}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Clock className="w-3 h-3" /> {format(new Date(c.created_date), "dd MMM, HH:mm")}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">AI Telesales Agent</h1>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              This agent handles after-hours enquiries — capturing leads, answering pricing questions,
              building quotes, and scheduling jobs automatically.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6 max-w-lg">
              {["Captures lead details", "Looks up pricing", "Prepares & sends quotes", "Books callbacks", "Works after hours", "Saves to CRM"].map((f) => (
                <span key={f} className="text-xs rounded-lg border bg-card px-3 py-2 text-muted-foreground">{f}</span>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b bg-card flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">{active.name}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs border rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Agent Active
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {bubbles.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  The agent will introduce itself when you send your first message.
                </p>
              ) : bubbles.map((b) =>
                b.who === "tool" ? (
                  <div key={b.key} className="flex justify-center">
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                      <Wrench className="w-3 h-3" /> used {b.text.replace(/_/g, " ")}
                    </span>
                  </div>
                ) : (
                  <div key={b.key} className={cn("max-w-[80%]", b.who === "user" && "ml-auto")}>
                    <div className={cn("rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                      b.who === "user" ? "bg-primary text-white rounded-tr-sm" : "bg-muted rounded-tl-sm")}>
                      {b.text}
                    </div>
                  </div>
                )
              )}
              {pending && (
                <div className="max-w-[80%]">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5 inline-flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="p-4 border-t bg-card flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Type a message…"
                disabled={pending}
                className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button onClick={send} disabled={pending || !input.trim()}
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
