import { createServiceClient } from "@/lib/supabase/server";
import { ChatWidget } from "../(public)/chat/chat-widget";

// Bare, chrome-free version for embedding in an <iframe> on an external site.
export const dynamic = "force-dynamic";

export default async function ChatEmbedPage() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("company_settings")
    .select("company_name")
    .limit(1)
    .maybeSingle<{ company_name: string | null }>();

  return (
    <div className="p-2">
      <ChatWidget companyName={data?.company_name ?? "our team"} />
    </div>
  );
}
