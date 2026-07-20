import { createServiceClient } from "@/lib/supabase/server";
import { ChatWidget } from "./chat-widget";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("company_settings")
    .select("company_name")
    .limit(1)
    .maybeSingle<{ company_name: string | null }>();

  return (
    <div className="py-4">
      <ChatWidget companyName={data?.company_name ?? "our team"} />
    </div>
  );
}
