import { create } from "zustand";

export type ToastKind = "success" | "error" | "info" | "route";

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  createdAt: number;
  duration: number;
  meta?: {
    section?: string;
    name?: string;
  };
}

interface ToastState {
  toasts: Toast[];
  push: (
    kind: ToastKind,
    message: string,
    opts?: { duration?: number; meta?: Toast["meta"] }
  ) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, message, opts) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const duration = opts?.duration ?? 4500;
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id, kind, message, createdAt: Date.now(), duration, meta: opts?.meta },
      ],
    }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, duration);
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (msg: string, duration?: number) =>
    useToastStore.getState().push("success", msg, { duration }),
  error: (msg: string, duration?: number) =>
    useToastStore.getState().push("error", msg, { duration }),
  info: (msg: string, duration?: number) =>
    useToastStore.getState().push("info", msg, { duration }),
  route: (section: string, name: string, duration = 10000) =>
    useToastStore.getState().push("route", `${section} → ${name}`, {
      duration,
      meta: { section, name },
    }),
};