"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils/cn";

interface DropdownItem {
  label:    string;
  value:    string;
  icon?:    React.ReactNode;
  color?:   string;
  disabled?: boolean;
}

interface DropdownProps {
  trigger:      React.ReactNode;
  items:        DropdownItem[];
  onSelect:     (value: string) => void;
  selected?:    string;
  align?:       "left" | "right";
  className?:   string;
  width?:       string;
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  selected,
  align = "left",
  className,
  width = "w-48",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen((o) => !o)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className={cn(
            `absolute z-50 mt-1 bg-dark-800 border border-dark-700
             rounded-xl shadow-dark-lg py-1 animate-slide-down`,
            width,
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item) => (
            <button
              key={item.value}
              disabled={item.disabled}
              onClick={() => {
                onSelect(item.value);
                setOpen(false);
              }}
              className={cn(
                `w-full flex items-center gap-2.5 px-3 py-2 text-sm
                 transition-colors text-left`,
                item.disabled
                  ? "opacity-40 cursor-not-allowed text-dark-500"
                  : selected === item.value
                  ? "bg-brand-600/15 text-brand-300"
                  : "text-dark-300 hover:text-dark-100 hover:bg-dark-700"
              )}
            >
              {item.icon && (
                <span style={{ color: item.color }}>{item.icon}</span>
              )}
              <span className="flex-1 truncate">{item.label}</span>
              {selected === item.value && (
                <span className="text-brand-400 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Simple select-style dropdown ──────────────────────────────────────────
interface SelectDropdownProps {
  value:     string;
  onChange:  (val: string) => void;
  options:   { value: string; label: string; color?: string }[];
  className?: string;
  placeholder?: string;
}

export function SelectDropdown({
  value,
  onChange,
  options,
  className,
  placeholder,
}: SelectDropdownProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <Dropdown
      trigger={
        <button
          className={cn(
            `flex items-center justify-between gap-2 w-full
             bg-dark-900 border border-dark-700 hover:border-dark-600
             text-dark-100 text-sm rounded-lg px-3 py-2.5
             transition-all duration-150`,
            className
          )}
        >
          <span
            className="truncate"
            style={{ color: selected?.color }}
          >
            {selected?.label ?? placeholder ?? "Select…"}
          </span>
          <ChevronDown className="w-4 h-4 text-dark-400 shrink-0" />
        </button>
      }
      items={options.map((o) => ({
        value: o.value,
        label: o.label,
        color: o.color,
      }))}
      onSelect={onChange}
      selected={value}
      width="w-full"
    />
  );
}