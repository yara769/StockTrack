import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as currency (SAR by default) */
export function formatCurrency(value: number | string, currency = "SAR"): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-SA", { style: "currency", currency }).format(num);
}

/** Format an ISO date string to a readable date */
export function formatDate(iso?: string | Date | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

/** Format an ISO date string with time */
export function formatDateTime(iso?: string | Date | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Truncate text to n chars */
export function truncate(str: string, n = 30): string {
  return str.length > n ? str.slice(0, n) + "…" : str;
}
