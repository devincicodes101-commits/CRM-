import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "contractor") redirect("/dashboard");

  const { data: contractor } = await supabase
    .from("contractors")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (contractor?.registration_completed) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <OnboardingForm
          defaultValues={{
            contact_name: contractor?.contact_name ?? profile.full_name,
            email: contractor?.email ?? profile.email,
            company_name: contractor?.company_name ?? "",
            phone: contractor?.phone ?? "",
            address_line1: contractor?.address_line1 ?? "",
            address_line2: contractor?.address_line2 ?? "",
            address_city: contractor?.address_city ?? "",
            address_postcode: contractor?.address_postcode ?? "",
            bank_account_name: contractor?.bank_account_name ?? "",
            bank_sort_code: contractor?.bank_sort_code ?? "",
            bank_account_number: contractor?.bank_account_number ?? "",
            vat_registered: contractor?.vat_registered ?? false,
            vat_number: contractor?.vat_number ?? "",
          }}
        />
      </div>
    </div>
  );
}
