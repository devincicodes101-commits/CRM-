import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LeadForm } from "@/components/leads/lead-form";

export default function NewLeadPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Leads
        </Link>
        <h1 className="text-2xl font-bold">New Lead</h1>
      </div>
      <LeadForm />
    </div>
  );
}