"use client";

import { cn } from "@/lib/utils";

/**
 * O-02 fix: replaced Framer Motion opacity pulse with a single CSS
 * `animate-pulse` animation (Tailwind built-in).
 * A 10×10 SkeletonTable previously spawned 100 JS-driven animations;
 * now it uses a single shared CSS keyframe — zero JS overhead.
 */

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-md animate-pulse", className)}
      style={{ background: "var(--bg-elevated)" }}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <SkeletonBlock className={className} />;
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-5 space-y-3"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-8 w-1/2" />
      <SkeletonBlock className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-2">
      {/* header row */}
      <div className="flex gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* data rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBlock key={c} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
