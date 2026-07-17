import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SpinWheelClient } from "./spin-wheel-client";

export default async function SpinWheelPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prizes } = await supabase
    .from("prize_settings")
    .select("id, prize_description, prize_emoji, wheel_type")
    .eq("is_active", true)
    .order("created_date");

  const activePrizes = prizes ?? [];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Friday Spin! 🎉</h1>
        <p className="text-muted-foreground mt-2">Weekly staff prize draw — spin to win!</p>
      </div>
      <SpinWheelClient prizes={activePrizes} />
    </div>
  );
}
