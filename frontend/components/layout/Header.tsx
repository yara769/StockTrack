"use client";

import { Bell, Search } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTranslations } from "next-intl";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [search, setSearch] = useState("");
  const t = useTranslations("Header");

  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b shrink-0"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Page title */}
      <div>
        <h1
          className="text-lg font-semibold leading-none"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Search bar */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
          }}
        >
          <Search size={14} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-40"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        {/* Notification bell */}
        <button
          aria-label={t("notificationsLabel")}
          className="relative flex items-center justify-center rounded-lg p-2 transition-colors"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <Bell size={16} />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent)" }}
          />
        </button>

        {/* Avatar */}
        <div
          className="flex items-center justify-center rounded-full text-xs font-semibold"
          style={{
            width: 34,
            height: 34,
            background: "var(--accent-muted)",
            color: "var(--accent)",
            border: "1px solid var(--border-accent)",
          }}
        >
          AD
        </div>
        <div
          className="p-3 border-t flex items-center justify-between"
          style={{ borderColor: "var(--border)" }}
        >
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
