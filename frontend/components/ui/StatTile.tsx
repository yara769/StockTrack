"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "./Skeleton";

interface StatTileProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  trend?: number;        // positive = up, negative = down
  accentColor?: string;  // CSS var or hex
  loading?: boolean;
}

export function StatTile({ label, value, sub, icon, trend, accentColor = "var(--accent)", loading }: StatTileProps) {
  if (loading) {
    return (
      <div
        className="rounded-xl p-5 space-y-3"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  const trendUp   = trend !== undefined && trend >= 0;
  const trendDown = trend !== undefined && trend < 0;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="rounded-xl p-5 relative overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Background glow blob */}
      <div
        className="absolute -top-4 -right-4 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: accentColor, opacity: 0.06, filter: "blur(20px)" }}
      />

      {/* Icon */}
      <div
        className="inline-flex items-center justify-center rounded-lg mb-4"
        style={{
          width: 40,
          height: 40,
          background: `${accentColor}22`,
          color: accentColor,
        }}
      >
        {icon}
      </div>

      {/* Value */}
      <div className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>

      {/* Label */}
      <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>

      {/* Trend / sub */}
      {(trend !== undefined || sub) && (
        <div className="flex items-center gap-1 mt-3 text-xs">
          {trend !== undefined && (
            <>
              {trendUp   && <TrendingUp  size={12} style={{ color: "var(--accent)" }} />}
              {trendDown && <TrendingDown size={12} style={{ color: "var(--danger)" }} />}
              <span style={{ color: trendUp ? "var(--accent)" : "var(--danger)" }}>
                {trendUp ? "+" : ""}{trend}%
              </span>
            </>
          )}
          {sub && <span style={{ color: "var(--text-muted)" }}>{sub}</span>}
        </div>
      )}
    </motion.div>
  );
}
