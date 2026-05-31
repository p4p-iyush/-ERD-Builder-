"use client";

import { useEffect, useState, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils/cn";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id:       string;
  type:     ToastType;
  title:    string;
  message?: string;
  duration?: number;
}

// ── Global toast store (lightweight, no Zustand needed) ───────────────────
type ToastListener = (toasts: Toast[]) => void;

class ToastStore {
  private toasts:    Toast[]         = [];
  private listeners: ToastListener[] = [];

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l([...this.toasts]));
  }

  add(toast: Omit<Toast, "id">) {
    const id = Math.random().toString(36).slice(2);
    this.toasts = [...this.toasts, { ...toast, id }];
    this.notify();
    return id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toastStore = new ToastStore();

// ── Public helpers ────────────────────────────────────────────────────────
export const toast = {
  success: (title: string, message?: string, duration = 3500) =>
    toastStore.add({ type: "success", title, message, duration }),
  error: (title: string, message?: string, duration = 5000) =>
    toastStore.add({ type: "error", title, message, duration }),
  info: (title: string, message?: string, duration = 3500) =>
    toastStore.add({ type: "info", title, message, duration }),
  warning: (title: string, message?: string, duration = 4000) =>
    toastStore.add({ type: "warning", title, message, duration }),
};

// ── Individual toast item ─────────────────────────────────────────────────
function ToastItem({
  toast: t,
  onRemove,
}: {
  toast:    Toast;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onRemove(t.id), 300);
  }, [t.id, onRemove]);

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const duration = t.duration ?? 3500;
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [t.duration, dismiss]);

  const styles = {
    success: {
      icon:   <CheckCircle2 className="w-4 h-4" />,
      colors: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      bar:    "bg-emerald-500",
    },
    error: {
      icon:   <AlertCircle className="w-4 h-4" />,
      colors: "border-red-500/30 bg-red-500/10 text-red-400",
      bar:    "bg-red-500",
    },
    info: {
      icon:   <Info className="w-4 h-4" />,
      colors: "border-brand-500/30 bg-brand-500/10 text-brand-400",
      bar:    "bg-brand-500",
    },
    warning: {
      icon:   <AlertTriangle className="w-4 h-4" />,
      colors: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      bar:    "bg-amber-500",
    },
  };

  const style = styles[t.type];

  return (
    <div
      className={cn(
        `relative flex items-start gap-3 p-4 rounded-xl border
         bg-dark-800/95 backdrop-blur-md shadow-dark-lg
         overflow-hidden transition-all duration-300 w-80`,
        visible && !leaving
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      )}
    >
      {/* Progress bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 h-0.5 animate-shrink",
          style.bar
        )}
        style={{
          animationDuration: `${t.duration ?? 3500}ms`,
          animationTimingFunction: "linear",
          animationFillMode: "forwards",
        }}
      />

      {/* Icon */}
      <div className={cn("shrink-0 mt-0.5", style.colors.split(" ")[2])}>
        {style.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-dark-100">{t.title}</p>
        {t.message && (
          <p className="text-xs text-dark-400 mt-0.5 leading-relaxed">
            {t.message}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="shrink-0 text-dark-500 hover:text-dark-300
                   transition-colors mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Toast container ───────────────────────────────────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastStore.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-24 right-4 z-[100] flex flex-col
                 gap-2 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem
            toast={t}
            onRemove={(id) => toastStore.remove(id)}
          />
        </div>
      ))}
    </div>
  );
}