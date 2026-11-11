import { create } from "zustand";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, variant?: ToastVariant, durationMs?: number) => string;
  dismissToast: (id: string) => void;
}

let toastSeq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, variant = "info", durationMs = 4000) => {
    const id = `toast-${++toastSeq}`;
    set((state) => {
      // Avoid stacking identical active messages.
      if (state.toasts.some((t) => t.message === message && t.variant === variant)) {
        return state;
      }
      return {
        toasts: [...state.toasts.slice(-4), { id, message, variant, durationMs }],
      };
    });
    return id;
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
