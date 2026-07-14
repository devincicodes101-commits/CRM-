import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron";
import { CRON_JOBS } from "@/lib/automations/registry";

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
