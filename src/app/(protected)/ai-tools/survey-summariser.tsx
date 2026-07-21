"use client";

import { useState, useRef, useTransition } from "react";
import { FileSearch, Loader2, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { summariseSurvey } from "./actions";

export function SurveySummariser() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSummarise() {
    if (!text.trim() && !fileRef.current?.files?.[0]) { setError("Please paste text or upload a file."); return; }
    setError(""); setOutput("");
    const fd = new FormData();
    fd.append("text", text.trim());
    const f = fileRef.current?.files?.[0];
    if (f) fd.append("file", f);
    start(async () => {
      const res = await summariseSurvey(fd);
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
        <FileSearch className="w-5 h-5 text-blue-500" />
        <p className="text-sm text-muted-foreground">
          Paste survey report text or upload a file (PDF/image). The AI only uses information present in the source — it won&apos;t invent findings.
        </p>
      </div>

      <div>
        <Label>Upload Survey Report (optional)</Label>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} className="text-sm" />
          {fileName && <Badge variant="secondary" className="gap-1"><Check className="w-3 h-3" /> {fileName}</Badge>}
        </div>
      </div>

      <div>
        <Label>Or Paste Survey Report Text</Label>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the asbestos survey report text here…" rows={8} />
      </div>

      <Button onClick={handleSummarise} disabled={loading} className="gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Summarising…</> : <><FileSearch className="w-4 h-4" /> Summarise Report</>}
      </Button>

      {error && (
        <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {output && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1"><FileSearch className="w-3 h-3" /> Survey Summary</Badge>
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
