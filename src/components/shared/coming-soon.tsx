import { Construction } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

// Placeholder for Base44 modules that have a nav entry but aren't ported yet.
// Keeps the sidebar complete without 404s. Replace with the real page as each
// module lands (see docs/PARITY.md).
export function ComingSoon({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="p-6 space-y-8">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-xl border bg-card p-12 text-center">
        <Construction className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-medium">Coming soon</p>
        <p className="text-sm text-muted-foreground mt-1">
          This module is being ported from Base44.
        </p>
      </div>
    </div>
  );
}
