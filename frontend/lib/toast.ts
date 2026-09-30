/**
 * Global toast store — built on zustand (already in dependencies).
 * No external toast library needed.
 */
import { create } from "zustand";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: Toast[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  push(message, variant = "info") {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    // Auto-dismiss after 4 s
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

/** Convenience helpers — import these in components/hooks */
export const toast = {
  success: (msg: string) => useToastStore.getState().push(msg, "success"),
  error:   (msg: string) => useToastStore.getState().push(msg, "error"),
  warning: (msg: string) => useToastStore.getState().push(msg, "warning"),
  info:    (msg: string) => useToastStore.getState().push(msg, "info"),
};
