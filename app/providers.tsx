"use client";

import { useEffect } from "react";
import { ToastContainer } from "../components/ui/Toast";
import { ErrorBoundary }  from "../components/ui/ErrorBoundary";
import { useUIStore }     from "../store";

// ── Syncs Zustand theme to <html> class ──────────────────────────────────
function ThemeSyncer() {
  const { theme } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  return null;
}

// ── Root providers ────────────────────────────────────────────────────────
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeSyncer />
      {children}
      <ToastContainer />
    </ErrorBoundary>
  );
}