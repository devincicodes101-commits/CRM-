"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Briefcase,
  FileText,
  Receipt,
  Truck,
  HardHat,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem, UserRole } from "@/types";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Leads", href: "/leads", icon: TrendingUp },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Quotes", href: "/quotes", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  {
    label: "Fleet",
    href: "/fleet",
    icon: Truck,
    roles: ["admin", "manager"],
  },
  {
    label: "Field",
    href: "/field",
    icon: Wrench,
    roles: ["admin", "manager", "operative"],
  },
  {
    label: "Contractors",
    href: "/contractors",
    icon: HardHat,
    roles: ["admin", "manager"],
  },
];

type SidebarProps = {
  userRole: UserRole;
};

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const visible = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <span className="font-bold text-lg text-sidebar-foreground">
          BuildStream
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {visible.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}