import { Trophy, Medal } from "lucide-react";

type RankedEntry = { name: string; jobs: number; value: number };

type Props = {
  ranked: RankedEntry[];
  attendanceByName: Record<string, { total: number; present: number }>;
};

const RANK_ICONS = [
  <Trophy key={0} className="size-4 text-yellow-500" />,
  <Medal key={1} className="size-4 text-zinc-400" />,
  <Medal key={2} className="size-4 text-amber-600" />,
];

export function LeaderboardPanel({ ranked, attendanceByName }: Props) {
  if (ranked.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold text-sm mb-3">Leaderboard</h2>
        <p className="text-sm text-muted-foreground italic">No completed jobs to rank yet.</p>
      </div>
    );
  }

  const maxJobs = ranked[0]?.jobs ?? 1;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <h2 className="font-semibold text-sm">Operative Leaderboard</h2>
      <div className="space-y-2">
        {ranked.map((entry, i) => {
          const att = attendanceByName[entry.name];
          const attRate = att
            ? Math.round((att.present / att.total) * 100)
            : null;
          return (
            <div
              key={entry.name}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="size-7 flex items-center justify-center shrink-0">
                {RANK_ICONS[i] ?? (
                  <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="font-medium text-sm truncate">{entry.name}</p>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                    <span>{entry.jobs} jobs</span>
                    <span>£{entry.value.toLocaleString()}</span>
                    {attRate !== null && (
                      <span
                        className={
                          attRate >= 90
                            ? "text-green-600"
                            : attRate >= 75
                            ? "text-yellow-600"
                            : "text-destructive"
                        }
                      >
                        {attRate}% att.
                      </span>
                    )}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(entry.jobs / maxJobs) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}