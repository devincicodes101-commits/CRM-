"use client";

import { useRealtimeRefresh } from "@/lib/use-realtime";

// Drop-in for server components: mounts the realtime subscription and renders
// nothing. e.g. <RealtimeRefresher tables={["jobs"]} />
export function RealtimeRefresher({
  tables,
  filterColumn,
  filterValue,
}: {
  tables: string[];
  filterColumn?: string;
  filterValue?: string;
}) {
  useRealtimeRefresh(
    tables,
    filterColumn && filterValue ? { column: filterColumn, value: filterValue } : undefined,
  );
  return null;
}
