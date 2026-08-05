import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron";
import { CRON_JOBS } from "@/lib/automations/registry";
import { createServiceClient } from "@/lib/supabase/server";
import { setEmailBrand } from "@/lib/automations/emails";

// Load company branding once so every automation email is branded (logo, name,
// colour, contact) instead of the generic fallback.
async function loadBrand() {
  try {
    const sb = await createServiceClient();
    const { data } = await sb
      .from("company_settings")
      .select("company_name, tagline, logo_url, primary_color, email, phone")
      .limit(1)
      .maybeSingle();
    if (data) {
      setEmailBrand({
        companyName: data.company_name,
        tagline: data.tagline,
        logoUrl: data.logo_url,
        brandColor: data.primary_color,
        email: data.email,
        phone: data.phone,
      });
    }
  } catch (e) {
    console.error("[cron] brand load failed", e);
  }
}

// Single dispatcher for every scheduled automation.
// Vercel Cron (see vercel.json) calls GET /api/cron/<slug> on schedule;
// the slug is looked up in CRON_JOBS and its `run` is executed.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ job: string }> }
) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { job } = await params;
  const def = CRON_JOBS[job];
  if (!def) {
    return NextResponse.json({ error: `Unknown job: ${job}` }, { status: 404 });
  }

  try {
    await loadBrand();
    const result = await def.run();
    return NextResponse.json({ job, name: def.name, ...result });
  } catch (e) {
    console.error(`[cron:${job}] failed`, e);
    return NextResponse.json(
      { job, ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
