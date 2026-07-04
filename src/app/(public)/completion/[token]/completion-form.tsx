"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { submitCompletion } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { jobId: string; token: string; customerName: string };

const SATISFACTION = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "satisfactory", label: "Satisfactory" },
  { value: "poor", label: "Poor" },
];

export function CompletionForm({ jobId, token, customerName }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [satisfaction, setSatisfaction] = useState("good");
  const [comments, setComments] = useState("");
  const [name, setName] = useState(customerName);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    if (!rating) { toast.error("Please select a star rating"); return; }
    startTransition(async () => {
      const result = await submitCompletion(jobId, token, {
        customer_name: name,
        star_rating: rating,
        customer_satisfaction: satisfaction,
        customer_comments: comments,
      });
      if (result?.error) toast.error(result.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700 p-8 text-center space-y-3">
        <div className="flex justify-center gap-1 text-yellow-400">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="size-7 fill-yellow-400" />
          ))}
        </div>
        <p className="font-bold text-xl text-green-800 dark:text-green-200">Thank You!</p>
        <p className="text-sm text-green-700 dark:text-green-300">
          Your feedback has been recorded. We appreciate your business.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-background p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-base">Sign Off & Rate Your Experience</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          By submitting this form you confirm the work has been completed to your satisfaction.
        </p>
      </div>

      {/* Star rating */}
      <div className="space-y-2">
        <Label>Overall Rating *</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`size-9 transition-colors ${
                  (hovered || rating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-muted-foreground">
            {["", "Poor", "Below average", "Good", "Very good", "Excellent!"][rating]}
          </p>
        )}
      </div>

      {/* Satisfaction */}
      <div className="space-y-2">
        <Label>Satisfaction Level</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SATISFACTION.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSatisfaction(s.value)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                satisfaction === s.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="cust-name">Your Name *</Label>
        <Input
          id="cust-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
        />
      </div>

      {/* Comments */}
      <div className="space-y-1.5">
        <Label htmlFor="comments">Comments (optional)</Label>
        <Textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          placeholder="Any additional feedback…"
        />
      </div>

      <Button type="submit" className="w-full h-11 text-base" disabled={pending}>
        {pending ? "Submitting…" : "Submit Sign-Off"}
      </Button>
    </form>
  );
}