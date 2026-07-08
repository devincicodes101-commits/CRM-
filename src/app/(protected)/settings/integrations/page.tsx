import Link from "next/link";
import { ChevronLeft, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Integration = {
  key: string;
  name: string;
  category: string;
  description: string;
  envVars: string[];
  docsUrl: string;
};

const INTEGRATIONS: Integration[] = [
  {
    key: "resend",
    name: "Resend",
    category: "Communications",
    description: "Transactional email sending for quote/invoice/sequence emails",
    envVars: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
    docsUrl: "https://resend.com/docs",
  },
  {
    key: "twilio",
    name: "Twilio",
    category: "Communications",
    description: "SMS notifications and reminders to customers and operatives",
    envVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"],
    docsUrl: "https://www.twilio.com/docs",
  },
  {
    key: "anthropic",
    name: "Anthropic (Claude)",
    category: "AI",
    description: "AI telesales agent for lead capture and customer queries",
    envVars: ["ANTHROPIC_API_KEY"],
    docsUrl: "https://docs.anthropic.com",
  },
  {
    key: "supabase",
    name: "Supabase",
    category: "Database",
    description: "PostgreSQL database and authentication",
    envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    docsUrl: "https://supabase.com/docs",
  },
];

function EnvCheck({ name }: { name: string }) {
  // In a server component we can check process.env directly
  const set = !!process.env[name];
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {set ? (
        <CheckCircle className="size-3.5 text-green-500" />
      ) : (
        <XCircle className="size-3.5 text-red-400" />
      )}
      <code className="font-mono">{name}</code>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Settings
        </Link>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure environment variables in your <code className="text-xs">.env.local</code> file
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((intg) => (
          <div key={intg.key} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{intg.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{intg.description}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">{intg.category}</Badge>
            </div>
            <div className="space-y-1 border-t pt-3">
              {intg.envVars.map((v) => (
                <EnvCheck key={v} name={v} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-muted bg-muted/30 p-4 text-sm space-y-1.5">
        <p className="font-medium">How to configure</p>
        <p className="text-muted-foreground text-xs">
          Add the required environment variables to your <code>.env.local</code> file at the project root.
          Restart the dev server after changes. Never commit this file to git.
        </p>
      </div>
    </div>
  );
}