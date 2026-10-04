"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize    = "sm" | "md" | "lg";

// M-01: Remove the `as any` spread by explicitly omitting Framer-Motion-only
// props that conflict with the HTML button interface.
type SafeMotionButtonProps = Omit<
  HTMLMotionProps<"button">,
  "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart" | "onDragOver"
>;

interface ButtonProps extends SafeMotionButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantMap: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--accent)",
    color: "#fff",
    border: "1px solid transparent",
  },
  secondary: {
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
  },
  danger: {
    background: "var(--danger-muted)",
    color: "var(--danger)",
    border: "1px solid var(--danger)",
  },
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-sm px-5 py-2.5 gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-opacity",
        sizeMap[size],
        (disabled || loading) && "opacity-50 pointer-events-none",
        className,
      )}
      style={{ ...variantMap[variant], ...style }}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </motion.button>
  );
}
