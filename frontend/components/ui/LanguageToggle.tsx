"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Common");

  const toggleLanguage = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    // Build the query string so switching locale preserves all params (e.g. ?cat=1&page=2)
    const query = searchParams.toString();
    const destination = query ? `${pathname}?${query}` : pathname;
    router.replace(destination as any, { locale: nextLocale });
  };

  const nextLabel = locale === "ar" ? "English" : "العربية";

  return (
    <button
      onClick={toggleLanguage}
      aria-label={t("languageToggle")}
      title={t("languageToggle")}
      className="p-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
      style={{
        background: "var(--bg-elevated)",
        color: "var(--text-primary)",
        border: "1px solid var(--border)",
      }}
    >
      <Globe size={16} style={{ color: "var(--accent)" }} />
      <span className="text-xs font-semibold">{nextLabel}</span>
    </button>
  );
}
