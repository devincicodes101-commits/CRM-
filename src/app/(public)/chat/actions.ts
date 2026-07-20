"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { onLeadCreated } from "@/lib/automations/triggers";

// Public website-chat lead capture. Anonymous visitors have no session, so this
// runs through the service client. Creating the lead fires the new-lead
// automation (telesales SMS + in-app alert) via onLeadCreated.
export async function captureWebsiteLead(data: {
  name: string;
  email?: string;
  phone?: string;
  service_interest?: string;
  message?: string;
}): Promise<{ ok: true } | { error: string }> {
  const name = data.name?.trim();
  if (!name) return { error: "Please enter your name" };
  if (!data.email?.trim() && !data.phone?.trim()) {
    return { error: "Please leave an email or phone number so we can reply" };
  }

  const supabase = await createServiceClient();
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      name,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      source: "website_form",
      category: "web_forms",
      status: "new",
      service_interest: data.service_interest?.trim() || null,
      message: data.message?.trim() || null,
      consent_given: true,
    })
    .select("id, name, email, phone, service_interest, source")
    .single();
  if (error) return { error: error.message };

  onLeadCreated(lead as Record<string, unknown> & { id: string });
  return { ok: true };
}
