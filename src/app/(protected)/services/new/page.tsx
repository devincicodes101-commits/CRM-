import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ServiceForm } from "@/components/services/service-form";

export default function NewServicePage() {
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/services"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Services
        </Link>
        <h1 className="text-2xl font-bold">New Service</h1>
      </div>
      <ServiceForm />
    </div>
  );
}