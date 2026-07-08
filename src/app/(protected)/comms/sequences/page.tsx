import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SequenceStepRow } from "@/components/comms/sequence-step-row";
import { AddSequenceStepForm } from "@/components/comms/add-sequence-step-form";
import type { EmailSequence } from "@/lib/schemas/comms";

const SEQUENCE_TYPES = [
  { key: "new_lead", label: "New Lead", description: "Triggered when a new lead is created" },
  { key: "quote_not_booked", label: "Quote Not Booked", description: "Triggered when a quote hasn't converted after send" },
  { key: "invoice_not_paid", label: "Invoice Not Paid", description: "Triggered when an invoice is overdue" },
] as const;

export default async function SequencesPage() {
  const supabase = await createClient();

  const { data: steps } = await supabase
    .from("email_sequences")
    .select("*")
    .order("sequence_type")
    .order("step")
    .returns<EmailSequence[]>();

  const byType = SEQUENCE_TYPES.reduce(
    (acc, t) => {
      acc[t.key] = (steps ?? []).filter((s) => s.sequence_type === t.key);
      return acc;
    },
    {} as Record<string, EmailSequence[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/comms"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Comms
        </Link>
        <h1 className="text-2xl font-bold">Email Sequences</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure automated email sequences by step and delay
        </p>
      </div>

      {SEQUENCE_TYPES.map((type) => {
        const typeSteps = byType[type.key] ?? [];
        return (
          <div key={type.key} className="rounded-xl border bg-card overflow-hidden">
            {/* Type header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-sm">{type.label}</h2>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {typeSteps.length} step{typeSteps.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Steps */}
            {typeSteps.length > 0 && (
              <div className="divide-y">
                {typeSteps.map((step) => (
                  <SequenceStepRow key={step.id} step={step} />
                ))}
              </div>
            )}

            {typeSteps.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground italic">No steps configured.</p>
            )}

            {/* Add step */}
            <div className="px-4 py-3 border-t bg-muted/30">
              <AddSequenceStepForm
                sequenceType={type.key as EmailSequence["sequence_type"]}
                nextStep={typeSteps.length + 1}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}