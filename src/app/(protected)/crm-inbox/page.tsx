import { createClient } from "@/lib/supabase/server";
import { InboxClient, type InboxConversation } from "./inbox-client";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

export default async function CrmInboxPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("id, conversation_id, customer_name, customer_email, subject, content, sender_type, is_read, status, created_date")
    .order("created_date", { ascending: true });

  // Group into conversations by conversation_id (fallback to customer_email).
  const map = new Map<string, InboxConversation>();
  for (const m of (data ?? []) as Row[]) {
    const key = m.conversation_id ?? m.customer_email ?? m.id;
    const existing = map.get(key);
    const msg = { id: m.id, content: m.content, sender_type: m.sender_type, created_date: m.created_date };
    if (existing) {
      existing.messages.push(msg);
      if (m.created_date > existing.latest) existing.latest = m.created_date;
      if (m.sender_type === "customer" && !m.is_read) existing.unread += 1;
      if (m.status === "open") existing.status = "open";
    } else {
      map.set(key, {
        key,
        conversationId: m.conversation_id ?? null,
        customerName: m.customer_name,
        customerEmail: m.customer_email,
        subject: m.subject ?? null,
        messages: [msg],
        latest: m.created_date,
        unread: m.sender_type === "customer" && !m.is_read ? 1 : 0,
        status: m.status ?? "open",
      });
    }
  }

  const conversations = [...map.values()].sort((a, b) => b.latest.localeCompare(a.latest));

  return <InboxClient conversations={conversations} />;
}
