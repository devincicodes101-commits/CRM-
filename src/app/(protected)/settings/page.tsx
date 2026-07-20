import Link from "next/link";
import { Settings2, ClipboardList, Trophy, Users2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TestEmailButton } from "./test-email-button";

const SECTIONS = [
  {
    href: "/settings/audit",
    icon: ClipboardList,
    label: "Audit Log",
    description: "See who changed what and when",
  },
  {
    href: "/settings/bonus",
    icon: Trophy,
    label: "Bonus & Commission",
    description: "Configure bonus tiers and commission rates",
  },
  {
    href: "/settings/team",
    icon: Users2,
    label: "Team & Invites",
    description: "Invite staff members and manage roles",
  },
  {
    href: "/settings/integrations",
    icon: Settings2,
    label: "Integrations",
    description: "Connect Resend, Twilio, Stripe and more",
  },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your BuildStream configuration</p>
      </div>

      <TestEmailButton defaultTo={user?.email ?? ""} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border bg-card p-5 flex items-start gap-4 hover:border-primary transition-colors group"
          >
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
              <s.icon className="size-5 text-muted-foreground group-hover:text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}