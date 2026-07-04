"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { submitFeedback } from "@/app/(public)/completion/[token]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { jobId: string; token: string; customerName: string };

export function FeedbackForm({ jobId, token, customerName }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [name, setName] = useState(customerName);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    if (!rating) { toast.error("Please select a star rating"); return; }
    startTransition(async () => {
      const result = await submitFeedback(jobId, token, {
        customer_name: name,
        star_rating: rating,
        feedback,
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
          Your feedback means a lot to us.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-background p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-base">How did we do?</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          We'd love to hear your thoughts on our service.
        </p>
      </div>

      {/* Star rating */}
      <div className="space-y-2">
        <Label>Rating *</Label>
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
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fb-name">Your Name *</Label>
        <Input
          id="fb-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fb-feedback">Feedback</Label>
        <Textarea
          id="fb-feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder="Tell us about your experience…"
        />
      </div>

      <Button type="submit" className="w-full h-11 text-base" disabled={pending}>
        {pending ? "Submitting…" : "Send Feedback"}
      </Button>
    </form>
  );
}