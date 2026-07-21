"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

const HIGH_VALUE_THRESHOLD = 3000;

async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Not authenticated" as const };
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!me || !["admin", "user", "sales", "telesales"].includes(me.role)) return { supabase, error: "Forbidden" as const };
  return { supabase, error: null };
}

// Mark a quote's follow-up as done (row "Done" button).
export async function markReminderDone(quoteId: string): Promise<{ ok: true } | { error: string }> {
  const { supabase, error } = await requireStaff();
  if (error) return { error };
  const { error: err } = await supabase.from("quotes").update({ reminder_done: true }).eq("id", quoteId);
  if (err) return { error: err.message };
  revalidatePath("/high-value-commercial");
  return { ok: true };
}

// Weekly chase: email each SALES AGENT their list of open, high-value commercial quotes.
// Mirrors Base44's highValueCommercialReminder backend function.
export async function sendHighValueReminders(): Promise<
  { sent: number; quotes_tracked: number } | { error: string }
> {
  const { error: authErr } = await requireStaff();
  if (authErr) return { error: authErr };

  const service = await createServiceClient();
  const { data: allQuotes, error } = await service
    .from("quotes")
    .select("id, client_type, total, status, sales_agent_id, sales_agent_name, customer_name, quote_number, sent_date, valid_until");
  if (error) return { error: error.message };

  const hv = (allQuotes ?? []).filter(
    (q) =>
      q.client_type === "commercial" &&
      (q.total ?? 0) >= HIGH_VALUE_THRESHOLD &&
      ["draft", "sent"].includes(q.status) &&
      q.sales_agent_name &&
      q.sales_agent_id
  );
  if (hv.length === 0) return { sent: 0, quotes_tracked: 0 };

  // Group by agent
  const byAgent = new Map<string, { name: string; quotes: typeof hv }>();
  for (const q of hv) {
    const g = byAgent.get(q.sales_agent_id) ?? { name: q.sales_agent_name as string, quotes: [] as typeof hv };
    g.quotes.push(q);
    byAgent.set(q.sales_agent_id, g);
  }

  const { data: users } = await service.from("users").select("id, email");
  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  const money = (n: number) => `£${(n ?? 0).toLocaleString("en-GB")}`;
  let sent = 0;

  for (const [agentId, ag] of byAgent) {
    const u = userMap.get(agentId);
    if (!u?.email) continue;
    const totalValue = ag.quotes.reduce((s, q) => s + (q.total ?? 0), 0);

    const rows = ag.quotes
      .map((q) => {
        const days = q.sent_date ? Math.floor((Date.now() - new Date(q.sent_date).getTime()) / 86400000) : null;
        return `<tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:10px 12px;font-weight:600">${q.customer_name ?? "N/A"}</td>
          <td style="padding:10px 12px">${q.quote_number ?? "N/A"}</td>
          <td style="padding:10px 12px;font-weight:700;color:#059669">${money(q.total ?? 0)}</td>
          <td style="padding:10px 12px">${q.status}</td>
          <td style="padding:10px 12px">${days !== null ? `${days} days ago` : "Not yet sent"}</td>
          <td style="padding:10px 12px">${q.valid_until ?? "N/A"}</td>
        </tr>`;
      })
      .join("");

    const body = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
      <div style="background:#1a1a1a;padding:28px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:22px">🏢 High-Value Commercial Quote Tracker</h1>
        <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px">Weekly reminder — quotes over ${money(HIGH_VALUE_THRESHOLD)} requiring follow-up</p>
      </div>
      <div style="background:#f8fafc;padding:24px 32px;border:1px solid #e2e8f0">
        <p style="margin:0 0 6px;font-size:15px">Hi <strong>${ag.name}</strong>,</p>
        <p style="margin:0 0 20px;color:#475569;font-size:14px">You have <strong>${ag.quotes.length} high-value commercial quote${ag.quotes.length !== 1 ? "s" : ""}</strong> totalling <strong style="color:#059669">${money(totalValue)}</strong> still open. Please follow up this week.</p>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden">
          <thead><tr style="background:#1a1a1a;color:#fff">
            <th style="padding:10px 12px;text-align:left;font-size:12px">Customer</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px">Quote Ref</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px">Value</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px">Status</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px">Sent</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px">Valid Until</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:20px;padding:16px;background:#fef3c7;border-radius:8px;border-left:4px solid #f59e0b">
          <p style="margin:0;font-size:13px;color:#92400e"><strong>💡 Tip:</strong> Commercial clients often need 2–3 touchpoints before deciding. A quick call this week can improve your close rate.</p>
        </div>
      </div>
      <div style="background:#f97316;padding:16px 32px;border-radius:0 0 12px 12px;text-align:center">
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,.85)">Automated weekly reminder from your CRM.</p>
      </div>
    </div>`;

    const res = await sendEmail({
      to: u.email,
      subject: `🏢 Weekly Chase: ${ag.quotes.length} High-Value Commercial Quote${ag.quotes.length !== 1 ? "s" : ""} (${money(totalValue)} total)`,
      html: body,
    });
    if (res.ok) sent++;
  }

  return { sent, quotes_tracked: hv.length };
}
