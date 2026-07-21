"use client";

import { useState, useTransition } from "react";
import { FileText, Loader2, Copy, Check, AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { generateRams } from "./actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Job = any;

export function RamsGenerator({ jobs }: { jobs: Job[] }) {
  const [selectedJobId, setSelectedJobId] = useState("");
  const [mode, setMode] = useState<"rams" | "method">("rams");
  const [siteDetails, setSiteDetails] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, start] = useTransition();

  const selectedJob = jobs?.find((j) => j.id === selectedJobId);

  function handleGenerate() {
    if (!selectedJob) { setError("Please select a job."); return; }
    setError(""); setOutput("");
    start(async () => {
      const res = await generateRams({
        jobTitle: selectedJob.title,
        serviceType: selectedJob.title,
        description: selectedJob.description || selectedJob.notes,
        address: selectedJob.address,
        siteDetails,
        mode,
      });
      if (res.ok) setOutput(res.text);
      else setError(res.error);
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-5 h-5 text-amber-500" />
        <p className="text-sm text-muted-foreground">
          AI-generated safety documents must be reviewed and approved by a competent person before use.
        </p>
      </div>

      <div className="grid gap-3">
        <div>
          <Label>Select Job</Label>
          <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">Choose a job…</option>
            {jobs?.map((j) => (
              <option key={j.id} value={j.id}>{j.title} — {j.customer_name || "No customer"}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Document Type</Label>
          <div className="flex gap-2 flex-wrap">
            <Button variant={mode === "rams" ? "default" : "outline"} size="sm" onClick={() => setMode("rams")}>
              RAMS (Risk Assessment + Method Statement)
            </Button>
            <Button variant={mode === "method" ? "default" : "outline"} size="sm" onClick={() => setMode("method")}>
              Method Statement Only
            </Button>
          </div>
        </div>

        {selectedJob && (
          <div className="text-xs space-y-0.5 bg-muted/40 rounded-lg p-3 border">
            <p><span className="font-semibold">Site:</span> {selectedJob.address || "Not set"}</p>
            <p><span className="font-semibold">Description:</span> {selectedJob.description || selectedJob.notes || "Not provided"}</p>
          </div>
        )}

        <div>
          <Label>Additional Site Details (optional)</Label>
          <Textarea value={siteDetails} onChange={(e) => setSiteDetails(e.target.value)}
            placeholder="e.g. 3rd floor office block, restricted access via rear lane, occupied premises below…" rows={3} />
        </div>

        <Button onClick={handleGenerate} disabled={loading || !selectedJob} className="gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><FileText className="w-4 h-4" /> Generate {mode === "rams" ? "RAMS" : "Method Statement"}</>}
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {output && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1"><FileText className="w-3 h-3" /> Generated {mode === "rams" ? "RAMS" : "Method Statement"}</Badge>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1">
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </Button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{output}</div>
        </div>
      )}
    </div>
  );
}
