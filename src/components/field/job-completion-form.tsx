"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle, Star, Video, Loader2, AlertTriangle } from "lucide-react";
import { completeJobFromField, uploadCompletionVideo } from "@/app/(protected)/field/actions";
import { enqueue, isOffline } from "@/lib/offline-queue";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type ChecklistItem = { label: string; checked: boolean };
type Props = { jobId: string; checklist?: ChecklistItem[] };

const SATISFACTION = [
  { value: "excellent", label: "Excellent", icon: "😄" },
  { value: "good", label: "Good", icon: "🙂" },
  { value: "satisfactory", label: "Satisfactory", icon: "😐" },
  { value: "poor", label: "Poor", icon: "😟" },
] as const;

export function JobCompletionForm({ jobId, checklist = [] }: Props) {
  const [notes, setNotes] = useState("");
  const [satisfaction, setSatisfaction] = useState<(typeof SATISFACTION)[number]["value"] | "">("");
  const [rating, setRating] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, startTransition] = useTransition();
  const videoRef = useRef<HTMLInputElement>(null);

  const missing = checklist.filter((c) => !c.checked).map((c) => c.label);

  function onVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("video", file);
    setUploadingVideo(true);
    startTransition(async () => {
      const res = await uploadCompletionVideo(jobId, fd);
      setUploadingVideo(false);
      if ("error" in res) toast.error(res.error);
      else { setVideoUrl(res.url); toast.success("Video attached"); }
      if (videoRef.current) videoRef.current.value = "";
    });
  }

  function handleComplete() {
    if (isOffline()) {
      enqueue({ type: "complete", jobId, notes });
      toast.success("Completion saved offline — will sync when back online");
      return;
    }
    startTransition(async () => {
      const result = await completeJobFromField(jobId, notes, {
        satisfaction: satisfaction || null,
        starRating: rating || null,
        comments: notes || null,
        videoUrl,
      });
      if (result?.error) toast.error(result.error);
      else toast.success("Job marked as complete");
    });
  }

  return (
    <div className="space-y-4">
      {missing.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 p-3 text-sm">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 dark:text-amber-200 font-medium">{missing.length} checklist item{missing.length === 1 ? "" : "s"} not ticked</p>
            <p className="text-amber-700/80 dark:text-amber-300/80 text-xs">{missing.join(", ")}</p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Customer satisfaction</Label>
        <div className="grid grid-cols-4 gap-2">
          {SATISFACTION.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSatisfaction(s.value)}
              className={`rounded-lg border p-2 text-center transition-colors ${satisfaction === s.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}
            >
              <div className="text-lg">{s.icon}</div>
              <div className="text-[10px] mt-0.5">{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Star rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star className={`size-7 ${rating >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="completion-notes">Completion notes / customer comments</Label>
        <Textarea
          id="completion-notes"
          placeholder="Any issues, extra work done, or comments from the customer…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Walkaround video (optional)</Label>
        <input ref={videoRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={onVideo} />
        <button
          type="button"
          onClick={() => videoRef.current?.click()}
          disabled={uploadingVideo}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/5 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-60"
        >
          {uploadingVideo ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />}
          {uploadingVideo ? "Uploading…" : videoUrl ? "Video attached ✓ — replace" : "Record walkaround"}
        </button>
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
        <span className="text-sm">I confirm the job is finished{missing.length > 0 ? " (despite the unticked items above)" : " and all checklist items are done"}.</span>
      </label>

      <Button onClick={handleComplete} disabled={!confirmed || pending} className="w-full">
        <CheckCircle className="size-4" />
        {pending ? "Completing…" : "Mark Job Complete"}
      </Button>
    </div>
  );
}
