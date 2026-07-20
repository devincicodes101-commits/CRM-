"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { submitPortalReview } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ReviewForm({ token }: { token: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      const res = await submitPortalReview(token, { star_rating: rating, review_text: text });
      if ("error" in res) toast.error(res.error);
      else {
        setDone(true);
        toast.success("Thank you for your review!");
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700 p-5 text-center">
        <p className="font-semibold text-green-800 dark:text-green-200">Thanks for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "size-7 transition-colors",
                (hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tell us about your experience (optional)…"
        rows={3}
      />
      <Button onClick={submit} disabled={pending || rating === 0}>
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </div>
  );
}
