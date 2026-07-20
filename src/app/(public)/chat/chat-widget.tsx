"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Send, MessageSquare } from "lucide-react";
import { captureWebsiteLead } from "./actions";
import { cn } from "@/lib/utils";

type Msg = { from: "bot" | "user"; text: string };
type Step = "name" | "contact" | "need" | "done";

const PROMPTS: Record<Step, string> = {
  name: "Hi 👋 Thanks for getting in touch! What's your name?",
  contact: "Great to meet you! What's the best email or phone number to reach you on?",
  need: "Perfect. Briefly, what do you need help with?",
  done: "Thank you! 🎉 We've got your details and someone will be in touch very shortly.",
};

export function ChatWidget({ companyName = "our team" }: { companyName?: string }) {
  const [messages, setMessages] = useState<Msg[]>([{ from: "bot", text: PROMPTS.name }]);
  const [step, setStep] = useState<Step>("name");
  const [input, setInput] = useState("");
  const [data, setData] = useState<{ name?: string; contact?: string; need?: string }>({});
  const [pending, start] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function submit() {
    const value = input.trim();
    if (!value || step === "done" || pending) return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text: value }]);

    if (step === "name") {
      setData((d) => ({ ...d, name: value }));
      setStep("contact");
      setMessages((m) => [...m, { from: "bot", text: PROMPTS.contact }]);
    } else if (step === "contact") {
      setData((d) => ({ ...d, contact: value }));
      setStep("need");
      setMessages((m) => [...m, { from: "bot", text: PROMPTS.need }]);
    } else if (step === "need") {
      const payload = { ...data, need: value };
      const isEmail = (payload.contact ?? "").includes("@");
      start(async () => {
        const res = await captureWebsiteLead({
          name: payload.name ?? "",
          email: isEmail ? payload.contact : undefined,
          phone: isEmail ? undefined : payload.contact,
          service_interest: value,
          message: value,
        });
        if ("error" in res) {
          setMessages((m) => [...m, { from: "bot", text: `Sorry — ${res.error}. Could you try again?` }]);
        } else {
          setStep("done");
          setMessages((m) => [...m, { from: "bot", text: PROMPTS.done }]);
        }
      });
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[600px] w-full max-w-md mx-auto rounded-2xl border bg-background overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-primary text-white">
        <MessageSquare className="size-5" />
        <div>
          <p className="font-semibold text-sm leading-tight">Chat with {companyName}</p>
          <p className="text-[11px] opacity-80">Typically replies within minutes</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[280px]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
              m.from === "bot"
                ? "bg-muted rounded-tl-sm"
                : "ml-auto bg-primary text-white rounded-tr-sm"
            )}
          >
            {m.text}
          </div>
        ))}
        {pending && <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-muted text-muted-foreground">…</div>}
      </div>

      {/* Input */}
      {step !== "done" && (
        <div className="flex items-center gap-2 border-t p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Type your message…"
            disabled={pending}
            className="flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={submit}
            disabled={pending || !input.trim()}
            className="size-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 shrink-0"
            aria-label="Send"
          >
            <Send className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
