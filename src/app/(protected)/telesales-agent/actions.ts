"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  checkBusinessHours, listServices, createLead, createQuote, sendQuoteTool, requestCallback,
} from "@/lib/telesales-tools";

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

const SYSTEM_PROMPT = `You are a friendly and professional sales assistant for an asbestos removal & construction company, embedded on the company website to chat with potential customers.

STEP 1 — CHECK BUSINESS HOURS: At the very start of every conversation, call the check_business_hours tool. Your behaviour depends on whether the business is open.

WHEN OPEN — CAPTURE PHONE NUMBER:
1. Greet warmly, ask what service they need.
2. Offer a quick call from the team, then ask for their best phone number.
3. Collect name and (if offered) email/address.
4. CONSENT (REQUIRED): before saving anything, ask: "Before I save your details, do you consent to us storing your information to contact you about your enquiry? You can withdraw consent at any time." Only proceed if they agree.
5. Once you have phone + consent, tell them the team will call shortly.
6. Save them via create_lead (consent_given: true).
7. Call request_callback with their name, phone, service_interest and lead_id.

WHEN CLOSED — SELF-SERVICE QUOTING:
1. Greet warmly; say the office is closed but you can help with a quote now.
2. Collect name, email, address, and service.
3. CONSENT (REQUIRED) — same as above; only proceed if they agree.
4. Use list_services to get the service's unit_price and unit_type.
5. Based on unit_type: fixed/per_unit → ask quantity, compute quantity × unit_price + 20% VAT, confirm, then create_quote and send_quote. per_sqm/per_lm/per_hour/per_day → ask for the measurement (NEVER invent it); if given, create an "indicative estimate" quote with a note that a survey is needed, then send_quote; if not known, offer to book a survey using next_opening.
6. Save them via create_lead (consent_given: true).
7. Tell them when the office reopens (next_opening).

TONE: Warm, conversational, confident — like a great receptionist. Keep messages short.

RULES:
- ALWAYS call check_business_hours first.
- CONSENT IS MANDATORY — never create a Lead/Quote without explicit consent.
- Never invent pricing — always look it up via list_services.
- Never invent measurements for area-based services.
- Always confirm details before creating records.
- VAT is 20%. Quotes valid 30 days. When creating a quote, include an items array of { service_name, quantity, unit_price, unit_type, total }.`;

const TOOLS: Anthropic.Tool[] = [
  { name: "check_business_hours", description: "Check whether the business is currently open. Returns is_open, current_time, opening_time, closing_time, next_opening. Call at the start of every conversation.", input_schema: { type: "object", properties: {} } },
  { name: "list_services", description: "Look up services and their unit_price/unit_type. Optional name query.", input_schema: { type: "object", properties: { query: { type: "string" } } } },
  { name: "create_lead", description: "Create a CRM lead. Requires explicit consent first.", input_schema: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, address: { type: "string" }, service_interest: { type: "string" }, notes: { type: "string" }, consent_given: { type: "boolean" } }, required: ["name", "consent_given"] } },
  { name: "create_quote", description: "Create a draft quote. Returns quote_id and quote_number.", input_schema: { type: "object", properties: { customer_name: { type: "string" }, customer_email: { type: "string" }, customer_address: { type: "string" }, items: { type: "array", items: { type: "object", properties: { service_name: { type: "string" }, quantity: { type: "number" }, unit_price: { type: "number" }, unit_type: { type: "string" }, total: { type: "number" } } } }, subtotal: { type: "number" }, vat_amount: { type: "number" }, total: { type: "number" }, notes: { type: "string" } }, required: ["customer_name", "items"] } },
  { name: "send_quote", description: "Email a prepared quote to the customer.", input_schema: { type: "object", properties: { quote_id: { type: "string" } }, required: ["quote_id"] } },
  { name: "request_callback", description: "Notify the sales team to call the customer back.", input_schema: { type: "object", properties: { customer_name: { type: "string" }, phone_number: { type: "string" }, service_interest: { type: "string" }, lead_id: { type: "string" } }, required: ["customer_name", "phone_number"] } },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function execTool(name: string, input: any): Promise<unknown> {
  switch (name) {
    case "check_business_hours": return checkBusinessHours();
    case "list_services": return listServices(input?.query);
    case "create_lead": return createLead(input);
    case "create_quote": return createQuote(input);
    case "send_quote": return sendQuoteTool(input?.quote_id);
    case "request_callback": return requestCallback(input);
    default: return { error: `Unknown tool ${name}` };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Msg = { role: "user" | "assistant"; content: any };

async function runAgent(messages: Msg[]): Promise<Msg[]> {
  if (!client) {
    messages.push({ role: "assistant", content: [{ type: "text", text: "The AI agent isn't configured yet — add ANTHROPIC_API_KEY on the server to enable it." }] });
    return messages;
  }
  for (let step = 0; step < 8; step++) {
    const resp = await client.messages.create({ model: MODEL, max_tokens: 1500, system: SYSTEM_PROMPT, tools: TOOLS, messages: messages as Anthropic.MessageParam[] });
    messages.push({ role: "assistant", content: resp.content });
    if (resp.stop_reason !== "tool_use") break;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = [];
    for (const block of resp.content) {
      if (block.type === "tool_use") {
        const out = await execTool(block.name, block.input);
        results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(out) });
      }
    }
    messages.push({ role: "user", content: results });
  }
  return messages;
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function sendTelesalesMessage(
  conversationId: string,
  text: string
): Promise<{ error: string } | { ok: true }> {
  if (!text.trim()) return { error: "Empty message" };
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };

  const { data: conv } = await supabase.from("telesales_conversations").select("messages").eq("id", conversationId).single<{ messages: Msg[] }>();
  if (!conv) return { error: "Conversation not found" };

  const messages: Msg[] = Array.isArray(conv.messages) ? conv.messages : [];
  messages.push({ role: "user", content: text.trim() });
  const updated = await runAgent(messages);

  const { error } = await supabase.from("telesales_conversations").update({ messages: updated }).eq("id", conversationId);
  if (error) return { error: error.message };
  revalidatePath("/telesales-agent");
  return { ok: true };
}

export async function createTelesalesConversation(name: string): Promise<{ id: string } | { error: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };
  const { data, error } = await supabase.from("telesales_conversations").insert({ name, created_by_id: user.id }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/telesales-agent");
  return { id: data.id };
}
