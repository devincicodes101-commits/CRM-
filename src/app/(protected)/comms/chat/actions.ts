"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type TelesalesResult = {
  reply: string;
  leadCaptured?: {
    name: string;
    email?: string;
    phone?: string;
    service?: string;
    notes?: string;
  };
  error?: string;
};

const SYSTEM_PROMPT = `You are Alex, a friendly and professional telesales assistant for BuildStream, a UK-based property services company. You handle enquiries about services including window cleaning, gutter clearing, pressure washing, and general property maintenance.

Your goals:
1. Greet warmly and understand what the customer needs
2. Capture lead information: name, contact (email or phone), service interest, property type, and urgency
3. Provide rough pricing guidance if asked (window clean from £35, gutters from £60, pressure wash from £80)
4. Offer to book a callback from the team
5. Be helpful, brief, and professional

When you have captured the customer's name and at least one contact method (email or phone), respond with a JSON block at the END of your message in this exact format:
{"LEAD_CAPTURED":{"name":"...","email":"...","phone":"...","service":"...","notes":"..."}}

Business hours are Monday–Friday 8am–6pm and Saturday 9am–1pm UK time.
Always respond in plain conversational English, no markdown.`;

function isBusinessHours() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const hour = now.getHours();
  if (day === 0) return false;
  if (day === 6) return hour >= 9 && hour < 13;
  return hour >= 8 && hour < 18;
}

export async function chatWithAgent(
  messages: ChatMessage[]
): Promise<TelesalesResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { reply: "AI agent not configured.", error: "ANTHROPIC_API_KEY missing" };

  if (!isBusinessHours()) {
    return {
      reply:
        "Thanks for reaching out! We're currently outside business hours (Mon–Fri 8am–6pm, Sat 9am–1pm). Please leave your name and number and we'll call you back first thing. Alternatively, you can request a quote online.",
    };
  }

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";

    // Parse lead capture JSON if present
    const jsonMatch = text.match(/\{"LEAD_CAPTURED":\{[^}]+\}\}/);
    let leadCaptured: TelesalesResult["leadCaptured"] | undefined;
    let displayText = text;

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as { LEAD_CAPTURED: TelesalesResult["leadCaptured"] };
        leadCaptured = parsed.LEAD_CAPTURED;
        displayText = text.replace(jsonMatch[0], "").trim();

        // Persist lead to Supabase
        const supabase = await createClient();
        if (leadCaptured && leadCaptured.name) {
          await supabase.from("leads").insert({
            name: leadCaptured.name,
            email: leadCaptured.email || null,
            phone: leadCaptured.phone || null,
            service_interest: leadCaptured.service || null,
            notes: (leadCaptured.notes || "Captured via AI telesales chat"),
            source: "website_form",
            status: "new",
          });
          revalidatePath("/leads");
        }
      } catch {
        // ignore parse errors
      }
    }

    return { reply: displayText, leadCaptured };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "AI error";
    return { reply: "Sorry, I'm having trouble responding right now.", error: msg };
  }
}