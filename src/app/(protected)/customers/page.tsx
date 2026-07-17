import Link from "next/link";
import { Mail, MapPin, Plus, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/lib/schemas/customers";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  lead: "bg-yellow-100 text-yellow-700",
  inactive: "bg-gray-100 text-gray-500",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const { type, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("*")
    .order("created_date", { ascending: false })
    .returns<Customer[]>();

  if (type && type !== "all") {
    query = query.eq("client_type", type);
  }
  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: customers } = await query;
  const list = customers ?? [];

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{list.length} total customers</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-sm border rounded-xl px-4 py-2 hover:bg-muted transition-colors font-medium">
            <Download className="size-4" /> Export CSV
          </button>
          <Link
            href="/customers/new"
            className="flex items-center gap-1.5 text-sm rounded-xl px-4 py-2 bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" /> Add Customer
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <form className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-2.5 size-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search customers…"
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        <div className="flex gap-1.5">
          {[["all", "All Clients"], ["domestic", "Domestic"], ["commercial", "Commercial"]].map(([val, label]) => (
            <Link
              key={val}
              href={`/customers?type=${val}${q ? `&q=${q}` : ""}`}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                (type ?? "all") === val
                  ? "bg-primary text-white border-primary"
                  : "hover:bg-muted border-border"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Card grid */}
      {list.length === 0 ? (
        <div className="rounded-2xl border bg-white shadow-sm p-16 text-center">
          <p className="text-muted-foreground mb-3">No customers yet.</p>
          <Link href="/customers/new" className="text-sm text-primary font-medium hover:underline">
            Add your first customer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c) => (
            <div key={c.id} className="rounded-2xl border bg-white shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/customers/${c.id}`} className="font-semibold text-base hover:text-primary transition-colors">
                    {c.name}
                  </Link>
                  {c.company && (
                    <p className="text-sm text-muted-foreground mt-0.5">{c.company}</p>
                  )}
                </div>
                <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[c.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {c.status}
                </span>
              </div>

              {/* Contact details */}
              <div className="space-y-1.5 text-sm">
                {c.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <svg className="size-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{c.phone}</span>
                  </div>
                )}
                {(c.address || c.city) && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0 mt-0.5" />
                    <span className="uppercase text-xs tracking-wide">
                      {[c.address, c.city, c.postcode].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-xs text-muted-foreground capitalize">{c.client_type}</span>
                {(c.total_spent ?? 0) > 0 && (
                  <span className="text-xs font-semibold text-primary">
                    £{Number(c.total_spent).toLocaleString()} spent
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
