import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Mail, Send } from "lucide-react";
import { ComposeForm } from "./compose-form";

export default async function StaffMailboxPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("role, email, full_name")
    .eq("id", user.id)
    .single();

  if (!me) redirect("/dashboard");

  const view = params.view ?? "inbox";

  const [inboxRes, sentRes, teamRes] = await Promise.all([
    supabase
      .from("staff_messages")
      .select("*")
      .eq("to_email", me.email)
      .order("created_date", { ascending: false }),
    supabase
      .from("staff_messages")
      .select("*")
      .eq("from_email", me.email)
      .order("created_date", { ascending: false }),
    supabase
      .from("users")
      .select("id, full_name, email, role")
      .neq("id", user.id)
      .order("full_name"),
  ]);

  const inbox = inboxRes.data ?? [];
  const sent = sentRes.data ?? [];
  const teamMembers = teamRes.data ?? [];
  const unread = inbox.filter((m) => !m.is_read).length;

  const messages = view === "sent" ? sent : inbox;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Mailbox</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Internal team messaging
          </p>
        </div>
        <ComposeForm
          senderEmail={me.email}
          senderName={me.full_name ?? me.email}
          teamMembers={teamMembers}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-1">
        <a
          href="/staff-mailbox?view=inbox"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            view !== "sent"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Inbox
            {unread > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs w-4 h-4">
                {unread}
              </span>
            )}
          </span>
        </a>
        <a
          href="/staff-mailbox?view=sent"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            view === "sent"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Sent
          </span>
        </a>
      </div>

      {/* Messages list */}
      {messages.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {view === "sent"
            ? "You haven't sent any messages yet."
            : "Your inbox is empty."}
        </div>
      ) : (
        <div className="space-y-1">
          {messages.map((msg) => (
            <MessageRow key={msg.id} msg={msg} isSent={view === "sent"} myEmail={me.email} />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageRow({
  msg,
  isSent,
  myEmail,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  msg: Record<string, any>;
  isSent: boolean;
  myEmail: string;
}) {
  const isUnread = !isSent && !msg.is_read;

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${isUnread ? "bg-primary/5 border-primary/20" : "hover:bg-muted/40"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isUnread && (
              <span className="inline-block w-2 h-2 rounded-full bg-primary shrink-0" />
            )}
            <p className={`text-sm truncate ${isUnread ? "font-semibold" : "font-medium"}`}>
              {isSent ? `To: ${msg.to_email}` : `From: ${msg.from_name ?? msg.from_email}`}
            </p>
          </div>
          <p className="text-sm font-medium mt-0.5 truncate">{msg.subject}</p>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {msg.body}
          </p>
        </div>
        <p className="text-xs text-muted-foreground shrink-0 mt-0.5">
          {format(new Date(msg.created_date), "d MMM, HH:mm")}
        </p>
      </div>
    </div>
  );
}
