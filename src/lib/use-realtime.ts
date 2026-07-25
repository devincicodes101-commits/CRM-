"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Subscribe to Postgres changes on the given tables and refresh the current
// route when anything changes — giving live updates without rebuilding the
// data flow. Optional filter scopes to a single row/foreign key.
export function useRealtimeRefresh(
  tables: string[],
  filter?: { column: string; value: string },
) {
  const router = useRouter();
  const key = tables.join(",");
  const fCol = filter?.column;
  const fVal = filter?.value;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`rt-${key}-${Math.random().toString(36).slice(2)}`);
    for (const table of tables) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(fCol && fVal ? { filter: `${fCol}=eq.${fVal}` } : {}),
        },
        () => router.refresh(),
      );
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fCol, fVal]);
}
