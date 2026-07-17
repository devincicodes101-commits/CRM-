"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";
import type { UserProfile } from "@/types";
import { NAV_ITEMS } from "./nav-items";

type SidebarProps = {
  user: UserProfile;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const visible = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user.role as UserRole)
  );

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = getInitials(user.full_name || user.email);
  const companyInitials = "BS";

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 overflow-hidden"
      style={{ backgroundColor: "var(--sidebar)" }}>

      {/* Company logo area */}
      <div className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
          style={{ background: "var(--primary)" }}>
          {companyInitials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "oklch(0.95 0 0)" }}>
            BuildStream CRM
          </p>
          <p className="text-xs truncate" style={{ color: "var(--sidebar-foreground)" }}>
            Field Service Management
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visible.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                active
                  ? "text-white shadow-sm"
                  : "hover:bg-white/5"
              )}
              style={
                active
                  ? { backgroundColor: "var(--primary)", color: "#fff" }
                  : { color: "var(--sidebar-foreground)" }
              }
            >
              <item.icon className={cn("h-4 w-4 shrink-0 transition-colors",
                active ? "text-white" : "opacity-70 group-hover:opacity-100"
              )} />
              <span className="flex-1 truncate">{item.label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t px-4 py-4 space-y-3"
        style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "oklch(0.55 0.15 30)" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" style={{ color: "oklch(0.9 0 0)" }}>
              {user.full_name || user.email}
            </p>
            <p className="text-xs capitalize truncate" style={{ color: "var(--sidebar-foreground)" }}>
              {user.role}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
          style={{ color: "var(--sidebar-foreground)" }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
