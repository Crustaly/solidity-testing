"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error";
};

const toastContext = React.createContext<{
  addToast: (t: Omit<ToastItem, "id">) => void;
} | null>(null);

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  return (
    <toastContext.Provider value={{ addToast }}>
      <div className="fixed bottom-4 right-4 z-[100] flex max-w-[420px] flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-xl border p-4 shadow-lg",
              t.variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
              t.variant === "error" && "border-red-200 bg-red-50 text-red-900",
              (t.variant === "default" || !t.variant) && "border-neutral-200 bg-white text-neutral-900"
            )}
          >
            {t.title && <p className="text-sm font-semibold">{t.title}</p>}
            {t.description && <p className="text-sm opacity-90">{t.description}</p>}
          </div>
        ))}
      </div>
    </toastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(toastContext);
  if (!ctx) throw new Error("useToast must be used within Toaster");
  return ctx;
}
