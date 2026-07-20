"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { onFeedbackCreated } from "@/lib/automations/triggers";

export async function submitCompletion(
  jobId: string,
  token: string,
  data: {
    customer_name: string;
    star_rating: number;
    customer_satisfaction: string;
    customer_comments: string;
  }
): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("job_completions").insert({
    job_id: jobId,
    customer_name: data.customer_name,
    star_rating: data.star_rating,
    customer_satisfaction: data.customer_satisfaction as "excellent" | "good" | "satisfactory" | "poor",
    customer_comments: data.customer_comments,
    customer_signed_off: true,
    completed_date: new Date().toISOString(),
    created_by_id: user?.id ?? null,
  });
  if (error) return { error: error.message };

  onFeedbackCreated({
    id: jobId,
    job_id: jobId,
    star_rating: data.star_rating,
    customer_name: data.customer_name,
    feedback: data.customer_comments,
  });

  revalidatePath(`/completion/${token}`);
}

export async function submitFeedback(
  jobId: string,
  token: string,
  data: {
    customer_name: string;
    star_rating: number;
    feedback: string;
  }
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("job_completions").insert({
    job_id: jobId,
    customer_name: data.customer_name,
    star_rating: data.star_rating,
    feedback: data.feedback,
    customer_signed_off: false,
    created_by_id: user?.id ?? null,
  });
  if (error) return { error: error.message };

  onFeedbackCreated({
    id: jobId,
    job_id: jobId,
    star_rating: data.star_rating,
    customer_name: data.customer_name,
    feedback: data.feedback,
  });

  revalidatePath(`/feedback/${token}`);
}