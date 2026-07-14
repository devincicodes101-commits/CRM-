"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  /**
   * A RENDERED icon element, e.g. `icon={<Truck className="h-4 w-4 text-purple-600" />}`.
   * Must be an element, not a component reference — Server Components can't pass a
   * function/component across the boundary to this Client Component.
   */
  icon?: ReactNode;
  /** Tailwind bg color class for the icon chip, e.g. "bg-emerald-50 dark:bg-emerald-900/20". */
  iconBg?: string;
  /** Tailwind text color class for the value. */
  valueColor?: string;
  trend?: { value: number; label?: string };
  delay?: number;
  className?: string;
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = "bg-primary/10",
  valueColor,
  trend,
  delay = 0,
  className,
}: StatCardProps) {
  const trendUp = trend ? trend.value >= 0 : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={cn("rounded-xl border bg-card p-5", className)}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        {icon && <span className={cn("p-2 rounded-md", iconBg)}>{icon}</span>}
      </div>
      <p className={cn("mt-3 text-2xl font-bold tracking-tight", valueColor)}>{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ""}
          </span>
        )}
      </div>
    </motion.div>
  );
}
