import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency.
 * @param value  — numeric value or decimal string from MySQL
 * @param locale — BCP 47 locale tag (defaults to 'ar-SA' for Arabic formatting)
 * @param currency — ISO 4217 code (defaults to 'SAR')
 */
export function formatCurrency(
  value: number | string,
  locale = "ar-SA",
  currency = "SAR",
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(num);
}

/**
 * Format an ISO date string to a readable date.
 * @param iso    — ISO date string or Date object
 * @param locale — BCP 47 locale tag (defaults to 'ar-SA')
 */
export function formatDate(iso?: string | Date | null, locale = "ar-SA"): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

/**
 * Format an ISO date string with time.
 * @param iso    — ISO date string or Date object
 * @param locale — BCP 47 locale tag (defaults to 'ar-SA')
 */
export function formatDateTime(iso?: string | Date | null, locale = "ar-SA"): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(locale, {
    year:   "numeric",
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Truncate text to n chars */
export function truncate(str: string, n = 30): string {
  return str.length > n ? str.slice(0, n) + "…" : str;
}
