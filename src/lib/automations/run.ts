import { after } from "next/server";

// Fire-and-forget runner for entity-triggered automations.
//
// Call this from a server action AFTER the DB write succeeds. It schedules the
// work to run after the response is sent (next/server `after`) and swallows/logs
// errors so a failing automation never breaks the user's action — mirroring
// Base44, where each automation fails independently of the triggering write.
//
//   await supabase.from("jobs").insert(...);
//   runAutomation("inviteContractorsForJob", () => inviteContractorsForJob(job));

export function runAutomation(
  name: string,
  fn: () => Promise<unknown>
): void {
  after(async () => {
    try {
      await fn();
    } catch (e) {
      console.error(`[automation:${name}] failed`, e);
    }
  });
}
