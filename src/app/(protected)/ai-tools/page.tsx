import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AiToolsClient } from "./ai-tools-client";

export const dynamic = "force-dynamic";

export default async function AiToolsPage() {
  const supabase = await createClient();
  const [jobsRes, servicesRes, contractorsRes] = await Promise.all([
    supabase.from("jobs").select("id, title, customer_name, description, notes, address").order("created_date", { ascending: false }).limit(300),
    supabase.from("services").select("id, name, category, unit_price, unit_type").eq("is_active", true).order("name"),
    supabase.from("contractors").select("*").order("company_name"),
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">AI Tools</h1>
          <p className="text-sm text-muted-foreground">AI-powered assistants for safety documents, pricing, and compliance</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" /> Powered by Claude
        </span>
      </div>

      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Important:</strong> AI-generated outputs are aids to support your work, not replacements for
          professional judgement. All safety documents (RAMS, method statements) and pricing must be reviewed and
          approved by a competent person before use.
        </p>
      </div>

      <AiToolsClient
        jobs={jobsRes.data ?? []}
        services={servicesRes.data ?? []}
        contractors={contractorsRes.data ?? []}
      />
    </div>
  );
}
