"use client";

import { FileText, FileSearch, PoundSterling, ClipboardCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RamsGenerator } from "./rams-generator";
import { SurveySummariser } from "./survey-summariser";
import { PricingSuggester } from "./pricing-suggester";
import { MissingDocsChecker } from "./missing-docs-checker";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function AiToolsClient({ jobs, services, contractors }: { jobs: Any[]; services: Any[]; contractors: Any[] }) {
  return (
    <Tabs defaultValue="rams">
      <TabsList className="flex flex-wrap h-auto">
        <TabsTrigger value="rams" className="gap-1.5"><FileText className="w-4 h-4" /> RAMS / Method Statement</TabsTrigger>
        <TabsTrigger value="survey" className="gap-1.5"><FileSearch className="w-4 h-4" /> Survey Summariser</TabsTrigger>
        <TabsTrigger value="pricing" className="gap-1.5"><PoundSterling className="w-4 h-4" /> Pricing Estimator</TabsTrigger>
        <TabsTrigger value="docs" className="gap-1.5"><ClipboardCheck className="w-4 h-4" /> Missing Documents</TabsTrigger>
      </TabsList>

      <div className="mt-4 rounded-xl border bg-card p-5">
        <TabsContent value="rams"><RamsGenerator jobs={jobs} /></TabsContent>
        <TabsContent value="survey"><SurveySummariser /></TabsContent>
        <TabsContent value="pricing"><PricingSuggester services={services} /></TabsContent>
        <TabsContent value="docs"><MissingDocsChecker contractors={contractors} /></TabsContent>
      </div>
    </Tabs>
  );
}
