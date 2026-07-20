import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CopyLinkButton } from "@/components/shared/copy-link-button";
import { ChatWidget } from "../../(public)/chat/chat-widget";

export default async function WebsiteChatPage() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const chatUrl = `${base}/chat`;
  const embedUrl = `${base}/chat-embed`;
  const embed = `<iframe src="${embedUrl}"\n  style="border:0;width:100%;max-width:420px;height:620px"\n  title="Chat with us"></iframe>`;

  const supabase = await createClient();
  const { data } = await supabase
    .from("company_settings")
    .select("company_name")
    .limit(1)
    .maybeSingle<{ company_name: string | null }>();

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Website Chat</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          A public chat widget that turns website visitors into leads — every enquiry
          creates a lead and alerts your team automatically.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Manage */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <p className="font-semibold text-sm">Live link</p>
            <p className="text-xs text-muted-foreground break-all">{chatUrl}</p>
            <div className="flex gap-2">
              <a
                href={chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm rounded-lg bg-primary text-white px-4 py-2 font-medium"
              >
                <ExternalLink className="size-4" /> Open chat
              </a>
              <CopyLinkButton url={chatUrl} label="Copy link" variant="outline" />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-3">
            <p className="font-semibold text-sm">Embed on your website</p>
            <p className="text-xs text-muted-foreground">
              Paste this into your site where you want the chat to appear.
            </p>
            <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{embed}</pre>
            <CopyLinkButton url={embed} label="Copy embed code" variant="outline" />
          </div>
        </div>

        {/* Preview */}
        <div>
          <p className="font-semibold text-sm mb-3">Live preview</p>
          <ChatWidget companyName={data?.company_name ?? "our team"} />
        </div>
      </div>
    </div>
  );
}
