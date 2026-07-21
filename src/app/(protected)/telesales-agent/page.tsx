import { createClient } from "@/lib/supabase/server";
import { TelesalesConsole } from "./console";

export const dynamic = "force-dynamic";

export default async function TelesalesAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from("telesales_conversations")
    .select("id, name, created_date")
    .order("created_date", { ascending: false });

  let active: { id: string; name: string; messages: unknown[] } | null = null;
  if (c) {
    const { data } = await supabase
      .from("telesales_conversations")
      .select("id, name, messages")
      .eq("id", c)
      .maybeSingle<{ id: string; name: string; messages: unknown[] }>();
    active = data ?? null;
  }

  return <TelesalesConsole conversations={conversations ?? []} active={active} />;
}
