import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SpinWheelClient } from "@/app/(protected)/spin-wheel/spin-wheel-client";

// §18 — the field crew's spin wheel (field prizes).
export default async function FieldSpinPage() {
  const supabase = await createClient();
  const { data: prizes } = await supabase
    .from("prize_settings")
    .select("id, prize_description, prize_emoji, wheel_type")
    .eq("wheel_type", "field")
    .eq("is_active", true);

  return (
    <div className="max-w-md mx-auto space-y-5 pb-8">
      <div>
        <Link href="/field" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="size-4" /> My Jobs
        </Link>
        <h1 className="text-xl font-bold">Friday Spin 🎡</h1>
        <p className="text-sm text-muted-foreground">Give it a spin and see what you win.</p>
      </div>
      <SpinWheelClient prizes={prizes ?? []} />
    </div>
  );
}
