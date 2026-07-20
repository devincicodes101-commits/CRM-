import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Service } from "@/lib/schemas/services";

const UNIT_LABELS: Record<string, string> = {
  per_sqm: "per m²",
  per_lm: "per lm",
  per_hour: "per hr",
  per_day: "per day",
  fixed: "Fixed",
  per_unit: "per unit",
};

const CATEGORIES = ["general", "roofing", "plumbing", "electrical", "painting", "flooring", "landscaping", "demolition", "renovation", "concrete", "carpentry", "insulation", "asbestos"];

const CATEGORY_ICONS: Record<string, string> = {
  asbestos: "⚠️", roofing: "🏠", plumbing: "🔧", electrical: "⚡", painting: "🎨",
  flooring: "🪵", landscaping: "🌿", demolition: "💥", renovation: "🔨",
  concrete: "🧱", carpentry: "🪚", insulation: "🌡️", general: "🔩",
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("services").select("*");
  if (cat && cat !== "all") query = query.eq("category", cat);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data: services } = await query
    .order("category")
    .order("name")
    .returns<Service[]>();
  const list = services ?? [];

  const usedCategories = [...new Set(list.map((s) => s.category))];

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Catalog</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{list.length} services configured</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-sm border rounded-xl px-4 py-2 hover:bg-muted transition-colors font-medium">
            Categories
          </button>
          <Link
            href="/services/new"
            className="flex items-center gap-1.5 text-sm rounded-xl px-4 py-2 bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" /> Add Service
          </Link>
        </div>
      </div>

      {/* Search + Category filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <form className="relative w-72">
          <svg className="absolute left-3 top-2.5 size-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search services…"
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        <div className="flex gap-1.5 flex-wrap">
          <Link
            href="/services?cat=all"
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${(!cat || cat === "all") ? "bg-primary text-white border-primary" : "hover:bg-muted border-border"}`}
          >
            All Categories
          </Link>
          {usedCategories.map((c) => (
            <Link
              key={c}
              href={`/services?cat=${c}`}
              className={`px-3 py-2 rounded-xl text-sm font-medium border capitalize transition-colors ${cat === c ? "bg-primary text-white border-primary" : "hover:bg-muted border-border"}`}
            >
              {c}
            </Link>
          ))}
        </div>
      </div>

      {/* Card grid */}
      {list.length === 0 ? (
        <div className="rounded-2xl border bg-white shadow-sm p-16 text-center">
          <p className="text-muted-foreground mb-3">No services yet.</p>
          <Link href="/services/new" className="text-sm text-primary font-medium hover:underline">
            Add your first service
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((s) => (
            <div key={s.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              {/* Image area */}
              <div className="h-40 bg-gray-100 flex items-center justify-center relative">
                {s.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl opacity-30">{CATEGORY_ICONS[s.category] ?? "🔩"}</span>
                )}
                {s.video_url && (
                  <span className="absolute top-2 left-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                    Demo
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-snug">{s.name}</h3>
                  <div className="flex gap-1 shrink-0">
                    <Link href={`/services/${s.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-muted-foreground hover:text-foreground">
                      <Pencil className="size-3.5" />
                    </Link>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <span className="self-start text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                  {s.category}
                </span>

                {s.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                )}

                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="font-bold text-primary">
                    £ {Number(s.unit_price).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">/ {UNIT_LABELS[s.unit_type] ?? s.unit_type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
