"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer border"
      style={{
        background: "var(--bg-elevated)",
        color: "var(--text-primary)",
        borderColor: "var(--border)",
      }}
    >
      <Globe size={18} className="text-[var(--accent)]" />
      <span className="text-xs font-semibold uppercase">
        {locale === "ar" ? "English" : "العربية"}
      </span>
    </button>
  );
}
