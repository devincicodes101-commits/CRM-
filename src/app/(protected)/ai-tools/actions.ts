"use server";

import { createClient } from "@/lib/supabase/server";
import { generateText, type ContentBlock, type AiResult } from "@/lib/anthropic";

async function requireUser(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── RAMS / Method Statement ───────────────────────────────────
const RAMS_SYSTEM = `You are a UK health & safety professional specialising in LICENSED ASBESTOS removal.
You write clear, structured Risk Assessments and Method Statements (RAMS) that follow HSE guidance
(Control of Asbestos Regulations 2012, HSG247, HSG264). Write in plain text suitable for a formal
document, using numbered sections and headings. Be practical and specific to the work described.
NEVER invent site-specific facts that were not provided — where a detail is unknown, insert a clearly
marked placeholder like "[TO CONFIRM]". End with a note that the document must be reviewed and
approved by a competent person before use.`;

export async function generateRams(input: {
  jobTitle?: string;
  serviceType?: string;
  description?: string;
  address?: string;
  siteDetails?: string;
  mode: "rams" | "method";
}): Promise<AiResult> {
  if (!(await requireUser())) return { ok: false, error: "Not authenticated" };
  const doc = input.mode === "rams"
    ? "a full RAMS (Risk Assessment AND Method Statement)"
    : "a Method Statement only";
  const user = `Produce ${doc} for the following asbestos job.
Job title: ${input.jobTitle ?? "N/A"}
Service type: ${input.serviceType ?? "N/A"}
Site address: ${input.address ?? "[TO CONFIRM]"}
Description: ${input.description ?? "Not provided"}
Additional site details: ${input.siteDetails || "None provided"}

Include, as applicable: scope of works, key hazards & control measures (with likelihood/severity),
PPE/RPE, enclosure & decontamination, waste handling & consignment, emergency procedures, and a
step-by-step method statement.`;
  return generateText({ system: RAMS_SYSTEM, content: user, maxTokens: 3000 });
}

// ── Survey Summariser ─────────────────────────────────────────
const SURVEY_SYSTEM = `You are an asbestos surveyor's assistant. Summarise the provided asbestos survey
report clearly and concisely. ONLY use information that is present in the source — do not invent
findings, materials, or locations. Produce: 1) a short overview, 2) a list of identified
asbestos-containing materials (location, type, condition, recommended action), 3) key risks, and
4) recommended next steps. If the source lacks detail, say so rather than guessing.`;

export async function summariseSurvey(formData: FormData): Promise<AiResult> {
  if (!(await requireUser())) return { ok: false, error: "Not authenticated" };
  const text = String(formData.get("text") ?? "").trim();
  const file = formData.get("file");

  const content: ContentBlock[] = [];
  if (file instanceof File && file.size > 0) {
    const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    if (file.type === "application/pdf") {
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } });
    } else if (file.type.startsWith("image/")) {
      content.push({ type: "image", source: { type: "base64", media_type: file.type, data: b64 } });
    }
  }
  if (text) content.push({ type: "text", text: `Survey report text:\n${text}` });
  if (content.length === 0) return { ok: false, error: "Please paste text or upload a file." };
  content.push({ type: "text", text: "Summarise the survey report above." });

  return generateText({ system: SURVEY_SYSTEM, content, maxTokens: 2000 });
}

// ── Pricing Estimator ─────────────────────────────────────────
const PRICING_SYSTEM = `You are an experienced asbestos-removal estimator in the UK. Produce an
INDICATIVE price estimate (not a binding quote) with a clear breakdown. Consider labour, access,
enclosure, waste consignment and disposal, and any specialist requirements. Show your reasoning and
a suggested price range in GBP. State clearly that final pricing must be confirmed by a human
estimator.`;

export async function suggestPricing(input: {
  serviceName?: string;
  serviceCategory?: string;
  area?: string;
  access?: string;
  wasteType?: string;
  notes?: string;
  unitPrice?: number | null;
  unitType?: string | null;
}): Promise<AiResult> {
  if (!(await requireUser())) return { ok: false, error: "Not authenticated" };
  const user = `Estimate pricing for this asbestos job.
Service: ${input.serviceName ?? "N/A"} (${input.serviceCategory ?? "general"})
Catalogue rate: ${input.unitPrice != null ? `£${input.unitPrice} ${input.unitType ?? ""}` : "not set"}
Area / quantity: ${input.area || "not specified"}
Access: ${input.access || "not specified"}
Waste type: ${input.wasteType || "not specified"}
Notes: ${input.notes || "none"}

Give an indicative total and a short breakdown.`;
  return generateText({ system: PRICING_SYSTEM, content: user, maxTokens: 1500 });
}
