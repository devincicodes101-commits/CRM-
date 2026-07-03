import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ServiceForm } from "@/components/services/service-form";
import type { Service } from "@/lib/schemas/services";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single<Service>();

  if (!service) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/services"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> Services
        </Link>
        <h1 className="text-2xl font-bold">Edit Service</h1>
      </div>
      <ServiceForm service={service} />
    </div>
  );
}