"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { contractorInsertSchema } from "@/lib/schemas/contractors";
import { z } from "zod";

const onboardingSchema = contractorInsertSchema.omit({
  user_id: true,
  registration_completed: true,
});

export type OnboardingValues = z.input<typeof onboardingSchema>;

export async function completeOnboarding(
  values: OnboardingValues
): Promise<{ error: string } | void> {
  const parsed = onboardingSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid form data" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.from("contractors").upsert(
    { ...parsed.data, user_id: user.id, registration_completed: true },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
