"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Send, Bot, User, CheckCircle } from "lucide-react";
import { chatWithAgent } from "@/app/(protected)/comms/chat/actions";
import type { ChatMessage, TelesalesResult } from "@/app/(protected)/comms/chat/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Message = ChatMessage & {
  leadCaptured?: TelesalesResult["leadCaptured"];
};

const INITIAL: Message = {
  role: "assistant",
  content:
    "Hi there! I'm Alex from BuildStream. How can I help you today? Are you looking for a quote, or do you have a question about our services?",
};

export function TelesalesChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    startTransition(async () => {
      const result = await chatWithAgent(
        newMessages.map((m) => ({ role: m.role, content: m.content }))
      );
      if (result.error) toast.error(result.error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.reply,
          leadCaptured: result.leadCaptured,
        },
      ]);
    });
  }

  return (
    <div className="rounded-xl border bg-card flex flex-col overflow-hidden" style={{ height: "70vh" }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2.5 max-w-[85%]",
              m.role === "user" && "ml-auto flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                m.role === "assistant"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {m.role === "assistant" ? (
                <Bot className="size-4" />
              ) : (
                <User className="size-4" />
              )}
            </div>
            <div className="space-y-1.5">
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "assistant"
                    ? "bg-muted rounded-tl-sm"
                    : "bg-primary text-primary-foreground rounded-tr-sm"
                )}
              >
                {m.content}
              </div>
              {m.leadCaptured && (
                <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="size-3.5 shrink-0" />
                  Lead captured: {m.leadCaptured.name}
                  {m.leadCaptured.email && ` · ${m.leadCaptured.email}`}
                  {m.leadCaptured.phone && ` · ${m.leadCaptured.phone}`}
                </div>
              )}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex gap-2.5 max-w-[85%]">
            <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Bot className="size-4" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
              <span className="flex gap-1">
                <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="border-t p-3 flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          className="flex-1"
          disabled={pending}
          autoFocus
        />
        <Button type="submit" disabled={pending || !input.trim()} size="sm">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}