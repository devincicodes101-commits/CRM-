"use server";

import { createServiceClient } from "@/lib/supabase/server";

// Public subcontractor self-registration. Creates a pending subcontractor record
// for admin review and raises an in-app alert. Anonymous → service client.
export async function registerSubcontractor(data: {
  name: string;
  company_name: string;
  email: string;
  phone?: string;
  starting_postcode?: string;
  max_radius_miles?: number;
  service_categories?: string[];
  covered_areas?: string[];
}): Promise<{ ok: true } | { error: string }> {
  const name = data.name?.trim();
  const company = data.company_name?.trim();
  const email = data.email?.trim();
  if (!name || !company || !email) {
    return { error: "Name, company and email are required" };
  }

  const supabase = await createServiceClient();

  const { error } = await supabase.from("subcontractors").insert({
    name,
    company_name: company,
    email,
    phone: data.phone?.trim() || null,
    starting_postcode: data.starting_postcode?.trim() || null,
    max_radius_miles: data.max_radius_miles ?? null,
    service_categories: data.service_categories ?? [],
    covered_areas: data.covered_areas ?? [],
    status: "pending",
  });
  if (error) return { error: error.message };

  // Notify admins in-app.
  await supabase.from("alerts").insert({
    alert_type: "message",
    title: "New subcontractor registration",
    message: `${company} (${name}, ${email}) has applied to join.`,
    status: "active",
  });

  return { ok: true };
}
