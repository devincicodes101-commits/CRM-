import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { VehicleForm } from "@/components/fleet/vehicle-form";
import type { Vehicle } from "@/lib/schemas/fleet";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single<Vehicle>();

  if (!vehicle) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/fleet/vehicles/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> {vehicle.name}
        </Link>
        <h1 className="text-2xl font-bold">Edit Vehicle</h1>
      </div>
      <VehicleForm vehicle={vehicle} />
    </div>
  );
}