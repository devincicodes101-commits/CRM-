"use client";

import { MobileNav } from "./mobile-nav";
import { Search, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserProfile } from "@/types";

type TopbarProps = {
  user: UserProfile;
};

export function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 lg:px-5 bg-white gap-3"
      style={{ borderColor: "oklch(0.91 0 0)" }}>
      <MobileNav userRole={user.role} />

      {/* Mail icon */}
      <a
        href="/staff-mailbox"
        className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 shrink-0"
        aria-label="Staff Mailbox"
      >
        <Mail className="h-5 w-5" />
      </a>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, quotes, invoices…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border bg-gray-50 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            style={{ borderColor: "oklch(0.91 0 0)", "--tw-ring-color": "var(--primary)" } as React.CSSProperties}
          />
        </div>
      </form>

      {/* Spacer */}
      <div className="flex-1 hidden lg:block" />
    </header>
  );
}
