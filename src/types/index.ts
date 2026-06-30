export type UserRole =
  | "admin"
  | "manager"
  | "operative"
  | "contractor"
  | "subcontractor"
  | "customer";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company_id: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_date: string;
  updated_date: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
};