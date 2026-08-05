import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { IntegrationCard } from "./integration-card";

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

type ConnRow = { integration_key: string; is_connected: boolean; credentials: { notes?: string } | null };

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: conns } = await supabase
    .from("integration_connections")
    .select("integration_key, is_connected, credentials")
    .returns<ConnRow[]>();
  const byKey = new Map((conns ?? []).map((c) => [c.integration_key, c]));

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
          Live keys are read from environment variables; mark what&apos;s connected and add account notes here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((intg) => {
          const conn = byKey.get(intg.key);
          return (
            <IntegrationCard
              key={intg.key}
              intgKey={intg.key}
              name={intg.name}
              category={intg.category}
              description={intg.description}
              envStatus={intg.envVars.map((v) => ({ name: v, set: !!process.env[v] }))}
              initialConnected={conn?.is_connected ?? intg.envVars.every((v) => !!process.env[v])}
              initialNotes={conn?.credentials?.notes ?? ""}
            />
          );
        })}
      </div>

      <div className="rounded-xl border border-muted bg-muted/30 p-4 text-sm space-y-1.5">
        <p className="font-medium">How to configure</p>
        <p className="text-muted-foreground text-xs">
          Add the required environment variables in Vercel (Project → Settings → Environment Variables) and redeploy.
        </p>
      </div>
    </div>
  );
}