"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onClose, title, description, children, size = "md" }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-40"
                style={{ background: "rgba(0,0,0,0.6)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            {/* Panel */}
            <Dialog.Content asChild>
              <motion.div
                className={`fixed z-50 top-1/2 left-1/2 w-full ${sizeMap[size]} rounded-2xl p-6 shadow-2xl`}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--glass-border)",
                }}
                initial={{ opacity: 0, scale: 0.95, y: "-48%" , x: "-50%" }}
                animate={{ opacity: 1, scale: 1,    y: "-50%" , x: "-50%" }}
                exit={{   opacity: 0, scale: 0.95, y: "-48%" , x: "-50%" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <Dialog.Title
                      className="text-base font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description
                        className="text-xs mt-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="rounded-lg p-1.5 transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    <X size={16} />
                  </button>
                </div>

                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
