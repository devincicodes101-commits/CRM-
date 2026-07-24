import { createClient } from "@/lib/supabase/server";
import { TemplatesClient } from "./templates-client";
import type { ServiceTemplate } from "@/lib/schemas/service-templates";

export const dynamic = "force-dynamic";

type ServiceOption = { id: string; name: string; category: string; unit_price: number; unit_type: string };

export default async function ServiceTemplatesPage() {
  const supabase = await createClient();
  const [{ data: templates }, { data: services }] = await Promise.all([
    supabase.from("service_templates").select("*").order("created_date", { ascending: false }).returns<ServiceTemplate[]>(),
    supabase.from("services").select("id, name, category, unit_price, unit_type").eq("is_active", true).order("name").returns<ServiceOption[]>(),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Service Templates</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Reusable bundles of services you can drop into a quote in one click.
        </p>
      </div>
      <TemplatesClient templates={templates ?? []} services={services ?? []} />
    </div>
  );
}
