import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { brandedEmail, money } from "@/lib/automations/emails";

// Server-side implementations of the tools the telesales agent can call.
// Ported from the Base44 backend functions (checkBusinessHours, requestCallbackCall,
// sendQuoteToCustomer) plus the entity operations (Service read, Lead/Quote create).

const DAY_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function checkBusinessHours() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("company_settings")
    .select("opening_time, closing_time, working_days, business_timezone")
    .limit(1)
    .maybeSingle<{ opening_time: string | null; closing_time: string | null; working_days: number[] | null; business_timezone: string | null }>();

  const timezone = data?.business_timezone || "Europe/London";
  const openingTime = data?.opening_time || "09:00";
  const closingTime = data?.closing_time || "17:30";
  const workingDays = data?.working_days || [1, 2, 3, 4, 5];

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const weekdayStr = parts.find((p) => p.type === "weekday")?.value || "";
  let hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  if (hour === 24) hour = 0;

  const currentDay = DAY_MAP[weekdayStr] ?? 0;
  const currentMinutes = hour * 60 + minute;
  const [openH, openM] = openingTime.split(":").map(Number);
  const [closeH, closeM] = closingTime.split(":").map(Number);
  const isWorkingDay = workingDays.includes(currentDay);
  const withinHours = currentMinutes >= openH * 60 + openM && currentMinutes < closeH * 60 + closeM;
  const is_open = isWorkingDay && withinHours;

  let next_opening: string | null = null;
  if (!is_open) {
    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7;
      if (workingDays.includes(checkDay)) {
        if (i === 0) {
          if (currentMinutes < openH * 60 + openM) { next_opening = `Today at ${openingTime}`; break; }
          continue;
        } else if (i === 1) { next_opening = `Tomorrow at ${openingTime}`; }
        else { next_opening = `${DAY_NAMES[checkDay]} at ${openingTime}`; }
        break;
      }
    }
  }

  return {
    is_open,
    current_time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    timezone, opening_time: openingTime, closing_time: closingTime, working_days: workingDays, next_opening,
  };
}

export async function listServices(query?: string) {
  const supabase = await createServiceClient();
  let q = supabase.from("services").select("id, name, category, unit_price, unit_type, licence_type").eq("is_active", true);
  if (query) q = q.ilike("name", `%${query}%`);
  const { data } = await q.order("name").limit(50);
  return data ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createLead(input: any) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.from("leads").insert({
    name: input.name,
    email: input.email || null,
    phone: input.phone || null,
    address: input.address || null,
    service_interest: input.service_interest || null,
    source: "website_form",
    category: "web_forms",
    status: "new",
    priority: "medium",
    notes: input.notes || null,
    message: input.message || null,
    consent_given: !!input.consent_given,
    consent_date: input.consent_given ? new Date().toISOString() : null,
  }).select("id").single();
  if (error) return { error: error.message };
  return { lead_id: data.id };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createQuote(input: any) {
  const supabase = await createServiceClient();
  const items = Array.isArray(input.items) ? input.items : [];
  const subtotal = Number(input.subtotal ?? items.reduce((s: number, i: { total?: number }) => s + (i.total ?? 0), 0));
  const vat = Number(input.vat_amount ?? subtotal * 0.2);
  const total = Number(input.total ?? subtotal + vat);
  const validUntil = input.valid_until ?? new Date(Date.now() + 30 * 86400000).toISOString();
  const { data, error } = await supabase.from("quotes").insert({
    customer_name: input.customer_name,
    customer_email: input.customer_email || null,
    customer_address: input.customer_address || null,
    client_type: "commercial",
    items,
    subtotal,
    vat_rate: 20,
    vat_amount: vat,
    total,
    status: "draft",
    valid_until: validUntil,
    notes: input.notes || null,
  }).select("id, quote_number").single();
  if (error) return { error: error.message };
  return { quote_id: data.id, quote_number: data.quote_number };
}

export async function sendQuoteTool(quoteId: string) {
  const supabase = await createServiceClient();
  const { data: q } = await supabase
    .from("quotes")
    .select("quote_number, customer_name, customer_email, total, public_token")
    .eq("id", quoteId)
    .single<{ quote_number: string; customer_name: string | null; customer_email: string | null; total: number | null; public_token: string }>();
  if (!q) return { error: "Quote not found" };
  if (!q.customer_email) return { error: "Quote has no customer email" };

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const res = await sendEmail({
    to: q.customer_email,
    subject: `Your quote ${q.quote_number}`,
    html: brandedEmail({
      heading: "Your quote is ready",
      body: `<p>Hi ${q.customer_name ?? "there"},</p>
        <p>Thank you for your enquiry. Your quote <strong>${q.quote_number}</strong> comes to
        <strong>${money(q.total)}</strong>. View and accept it online below.</p>`,
      cta: { label: "View your quote", url: `${base}/quote/${q.public_token}` },
    }),
  });
  if (!res.ok) return { error: res.error };
  await supabase.from("quotes").update({ status: "sent", sent_date: new Date().toISOString() }).eq("id", quoteId);
  return { success: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requestCallback(input: any) {
  const supabase = await createServiceClient();
  await supabase.from("alerts").insert({
    alert_type: "message",
    title: `📞 Call Requested – ${input.customer_name}`,
    message: `Website visitor wants a callback.\nName: ${input.customer_name}\nPhone: ${input.phone_number}\nService: ${input.service_interest || "Not specified"}`,
    customer_name: input.customer_name,
    status: "active",
  });
  if (input.lead_id) {
    await supabase.from("leads").update({
      status: "contacted",
      notes: `Phone number provided via website chat: ${input.phone_number}. Callback required.`,
    }).eq("id", input.lead_id);
  }
  return { success: true };
}
