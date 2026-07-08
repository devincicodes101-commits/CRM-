import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { AttendanceLogger } from "@/components/fleet/attendance-logger";
import type { Attendance } from "@/lib/schemas/fleet";

const STATUS_VARIANT = {
  present: "default",
  absent: "destructive",
  late: "secondary",
  early_leave: "outline",
} as const;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage() {
  const supabase = await createClient();
  const today = todayISO();

  const { data: records } = await supabase
    .from("attendance")
    .select("*")
    .order("attendance_date", { ascending: false })
    .order("operative_name", { ascending: true })
    .limit(100)
    .returns<Attendance[]>();

  const todayRecords = (records ?? []).filter((r) => r.attendance_date === today);
  const pastRecords = (records ?? []).filter((r) => r.attendance_date !== today);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/fleet"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Fleet
        </Link>
        <h1 className="text-2xl font-bold">Attendance Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track operative attendance by day</p>
      </div>

      {/* Log form */}
      <AttendanceLogger />

      {/* Today */}
      {todayRecords.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Today — {new Date(today).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </h2>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-2 font-medium">Operative</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Clock In</th>
                  <th className="px-4 py-2 font-medium">Clock Out</th>
                  <th className="px-4 py-2 font-medium">Hours</th>
                  <th className="px-4 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.map((r) => (
                  <AttendanceRow key={r.id} record={r} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Past records */}
      {pastRecords.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Recent History</h2>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Operative</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Clock In</th>
                  <th className="px-4 py-2 font-medium">Clock Out</th>
                  <th className="px-4 py-2 font-medium">Hours</th>
                </tr>
              </thead>
              <tbody>
                {pastRecords.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {new Date(r.attendance_date).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{r.operative_name}</td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant={STATUS_VARIANT[r.status as keyof typeof STATUS_VARIANT] ?? "outline"}
                        className="capitalize text-xs"
                      >
                        {r.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {r.clock_in_time
                        ? new Date(r.clock_in_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {r.clock_out_time
                        ? new Date(r.clock_out_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.hours_worked != null ? `${r.hours_worked}h` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(records ?? []).length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">No attendance records yet. Log one above.</p>
        </div>
      )}
    </div>
  );
}

function AttendanceRow({ record: r }: { record: Attendance }) {
  const STATUS_VARIANT = {
    present: "default",
    absent: "destructive",
    late: "secondary",
    early_leave: "outline",
  } as const;

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="px-4 py-2.5 font-medium">{r.operative_name}</td>
      <td className="px-4 py-2.5">
        <Badge
          variant={STATUS_VARIANT[r.status as keyof typeof STATUS_VARIANT] ?? "outline"}
          className="capitalize text-xs"
        >
          {r.status.replace("_", " ")}
        </Badge>
      </td>
      <td className="px-4 py-2.5 text-muted-foreground">
        {r.clock_in_time
          ? new Date(r.clock_in_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
          : "—"}
      </td>
      <td className="px-4 py-2.5 text-muted-foreground">
        {r.clock_out_time
          ? new Date(r.clock_out_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
          : "—"}
      </td>
      <td className="px-4 py-2.5">
        {r.hours_worked != null ? `${r.hours_worked}h` : "—"}
      </td>
      <td className="px-4 py-2.5 text-muted-foreground italic text-xs max-w-[200px] truncate">
        {r.notes ?? "—"}
      </td>
    </tr>
  );
}