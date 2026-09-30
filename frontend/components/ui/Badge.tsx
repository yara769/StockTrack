"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: "var(--accent-muted)", color: "var(--accent)" },
  success: { bg: "var(--accent-muted)", color: "var(--accent)" },
  warning: { bg: "var(--amber-muted)", color: "var(--amber)" },
  danger: { bg: "var(--danger-muted)", color: "var(--danger)" },
  muted: { bg: "var(--bg-elevated)", color: "var(--text-muted)" },
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  const { bg, color } = variantStyles[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
}

/** Maps common status strings to Badge variants & handles translation */
export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("status");

  const map: Record<string, BadgeVariant> = {
    completed: "success",
    paid: "success",
    received: "success",
    active: "success",
    pending: "warning",
    partial: "warning",
    cancelled: "danger",
    failed: "danger",
    returned: "danger",
  };

  const normalizedStatus = status?.toLowerCase() ?? "";
  const variant = map[normalizedStatus] ?? "muted";

  // Translate status if key exists in i18n file, otherwise fallback to original status
  const translatedStatus = t.has(normalizedStatus)
    ? t(normalizedStatus)
    : status;

  return <Badge variant={variant}>{translatedStatus}</Badge>;
}
