import Link from "next/link";
import { Mail, MessageSquare, ListOrdered, Send, Bot } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickEmailForm } from "@/components/comms/quick-email-form";
import { QuickSmsForm } from "@/components/comms/quick-sms-form";
import { MessageThread } from "@/components/comms/message-thread";
import type { Message } from "@/lib/schemas/comms";

export default async function CommsPage() {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .order("created_date", { ascending: false })
    .limit(50)
    .returns<Message[]>();

  const list = messages ?? [];
  const unread = list.filter((m) => !m.is_read && m.sender_type === "customer").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Communications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Email, SMS and message inbox
            {unread > 0 && (
              <span className="ml-2 text-primary font-medium">{unread} unread</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/comms/chat"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Bot className="size-4" /> AI Agent
          </Link>
          <Link
            href="/comms/sequences"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ListOrdered className="size-4" /> Sequences
          </Link>
        </div>
      </div>

      {/* Quick-send panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <h2 className="font-medium text-sm">Send Email</h2>
          </div>
          <QuickEmailForm />
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-muted-foreground" />
            <h2 className="font-medium text-sm">Send SMS</h2>
          </div>
          <QuickSmsForm />
        </div>
      </div>

      {/* Message inbox */}
      <div className="space-y-2">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Send className="size-3.5" /> Message Inbox
        </h2>

        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <Mail className="size-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((m) => (
              <MessageThread key={m.id} message={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}