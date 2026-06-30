export type { UserRole } from "@/lib/schemas/users";
export type { User as UserProfile } from "@/lib/schemas/users";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: import("@/lib/schemas/users").UserRole[];
};
