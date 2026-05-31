"use client";

import { useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useUIStore } from "../../store";
import { Tooltip } from "../../components/ui/Tooltip";
import { cn } from "../../lib/utils/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useUIStore();

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

  return (
    <Tooltip content={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      <button
        onClick={toggleTheme}
        className={cn(
          `w-9 h-9 rounded-lg flex items-center justify-center
           transition-all duration-200 hover:bg-dark-700
           text-dark-400 hover:text-dark-200`,
          className
        )}
        aria-label="Toggle theme"
      >
        {theme === "dark"
          ? <Sun  className="w-4 h-4" />
          : <Moon className="w-4 h-4" />
        }
      </button>
    </Tooltip>
  );
}