import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BonusSettingsPanel } from "@/components/settings/bonus-settings-panel";
import { CommissionPanel } from "@/components/settings/commission-panel";
import { LeaderboardPanel } from "@/components/settings/leaderboard-panel";
import type { BonusSettings, CommissionSettings } from "@/lib/schemas/admin";

export default async function BonusPage() {
  const supabase = await createClient();

  const [
    { data: bonusSettings },
    { data: commissionSettings },
    { data: jobs },
    { data: attendanceRaw },
  ] = await Promise.all([
    supabase.from("bonus_settings").select("*").order("priority").returns<BonusSettings[]>(),
    supabase.from("commission_settings").select("*").limit(1).returns<CommissionSettings[]>(),
    supabase.from("jobs").select("id, assigned_team, status, total_value, completed_date"),
    supabase.from("attendance").select("operative_name, status"),
  ]);

  // Build leaderboard from completed jobs
  const completedJobs = (jobs ?? []).filter((j) => j.status === "completed");
  const leaderboard: Record<string, { name: string; jobs: number; value: number }> = {};
  for (const job of completedJobs) {
    const name: string = (job.assigned_team as string) || "Unassigned";
    if (!leaderboard[name]) leaderboard[name] = { name, jobs: 0, value: 0 };
    leaderboard[name].jobs++;
    leaderboard[name].value += Number(job.total_value ?? 0);
  }
  const ranked = Object.values(leaderboard).sort((a, b) => b.jobs - a.jobs);

  // Attendance rates
  const attendance = (attendanceRaw ?? []) as Array<{ operative_name: string; status: string }>;
  const attendanceByName: Record<string, { total: number; present: number }> = {};
  for (const a of attendance) {
    const n = a.operative_name;
    if (!attendanceByName[n]) attendanceByName[n] = { total: 0, present: 0 };
    attendanceByName[n].total++;
    if (["present", "late"].includes(a.status)) attendanceByName[n].present++;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Settings
        </Link>
        <h1 className="text-2xl font-bold">Bonus & Commission</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure tiers, view leaderboard, calculate commissions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BonusSettingsPanel settings={bonusSettings ?? []} />
        <CommissionPanel settings={commissionSettings?.[0] ?? null} />
      </div>

      <LeaderboardPanel ranked={ranked} attendanceByName={attendanceByName} />
    </div>
  );
}