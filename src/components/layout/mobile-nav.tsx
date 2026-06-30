"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
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
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet";
import type { NavItem, UserRole } from "@/types";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Leads", href: "/leads", icon: TrendingUp },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Quotes", href: "/quotes", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Fleet", href: "/fleet", icon: Truck, roles: ["admin", "user"] },
  {
    label: "Field",
    href: "/field",
    icon: Wrench,
    roles: ["admin", "user", "operative"],
  },
  {
    label: "Contractors",
    href: "/contractors",
    icon: HardHat,
    roles: ["admin", "user"],
  },
];

type MobileNavProps = {
  userRole: UserRole;
};

export function MobileNav({ userRole }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const visible = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden inline-flex items-center justify-center size-9 rounded-md hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="w-64 p-0">
        <div className="h-16 flex items-center justify-between px-6 border-b">
          <span className="font-bold text-lg">BuildStream</span>
          <button
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="py-4 px-3">
          <ul className="space-y-1">
            {visible.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
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
      </SheetContent>
    </Sheet>
  );
}
