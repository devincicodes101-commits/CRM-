import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { onLeadCreated } from "@/lib/automations/triggers";

// Public website-form lead capture (Base44 captureWebsiteLead). CORS-open so an
// external marketing site can POST enquiries straight into the CRM. Creates a
// lead and fires onLeadCreated (which SMS-alerts telesales when Twilio is set).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      name, email, phone, postcode,
      service_required, property_type, project_details,
      source = "website_form", consent_given = false,
    } = body ?? {};

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400, headers: CORS });
    }

    const notes = [
      property_type ? `Property Type: ${property_type}` : null,
      postcode ? `Postcode: ${postcode}` : null,
      project_details ? `Project Details: ${project_details}` : null,
    ].filter(Boolean).join("\n");

    // 'ai_chatbot' maps to the ai_sales_agent source; anything else → website_form.
    const leadSource = source === "ai_chatbot" ? "ai_sales_agent" : "website_form";

    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: String(name).trim(),
        email: email || null,
        phone: phone || null,
        address: postcode || null,
        service_interest: service_required || null,
        source: leadSource,
        status: "new",
        priority: "medium",
        notes: notes || null,
        message: project_details || null,
        consent_given: !!consent_given,
        consent_date: consent_given ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });

    onLeadCreated({ id: data.id, name: String(name).trim(), email: email || null, phone: phone || null, service_interest: service_required || null, source: leadSource });

    return NextResponse.json({ success: true, lead_id: data.id }, { status: 201, headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to capture lead" }, { status: 500, headers: CORS });
  }
}
