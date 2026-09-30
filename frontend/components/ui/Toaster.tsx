"use client";

/**
 * Toaster — renders the global toast queue.
 * Mount once in app/layout.tsx inside <Providers>.
 */
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToastStore, type ToastVariant } from "@/lib/toast";

const variantConfig: Record<
  ToastVariant,
  { icon: React.ReactNode; border: string; text: string }
> = {
  success: {
    icon: <CheckCircle size={16} />,
    border: "var(--accent)",
    text:   "var(--accent)",
  },
  error: {
    icon: <AlertCircle size={16} />,
    border: "var(--danger)",
    text:   "var(--danger)",
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    border: "var(--amber)",
    text:   "var(--amber)",
  },
  info: {
    icon: <Info size={16} />,
    border: "var(--border-accent)",
    text:   "var(--text-secondary)",
  },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const cfg = variantConfig[t.variant];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{   opacity: 0, y: 10,  scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-xl min-w-[280px] max-w-[400px]"
              style={{
                background:   "var(--bg-elevated)",
                border:       `1px solid ${cfg.border}`,
                borderLeft:   `4px solid ${cfg.border}`,
              }}
            >
              <span style={{ color: cfg.text, marginTop: 1 }}>{cfg.icon}</span>
              <p
                className="flex-1 text-sm leading-snug"
                style={{ color: "var(--text-primary)" }}
              >
                {t.message}
              </p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded p-0.5 transition-opacity opacity-60 hover:opacity-100"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
