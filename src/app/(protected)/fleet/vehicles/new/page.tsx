import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { VehicleForm } from "@/components/fleet/vehicle-form";

export default function NewVehiclePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/fleet"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Fleet
        </Link>
        <h1 className="text-2xl font-bold">Add Vehicle</h1>
      </div>
      <VehicleForm />
    </div>
  );
}