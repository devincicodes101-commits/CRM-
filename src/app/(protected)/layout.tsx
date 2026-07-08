import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { UserProfile } from "@/types";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single<UserProfile>();

  const safeProfile: UserProfile = profile ?? {
    id: user.id,
    email: user.email ?? "",
    full_name: user.email ?? "",
    role: "admin",
    nav_permissions: [],
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={safeProfile.role} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar user={safeProfile} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}