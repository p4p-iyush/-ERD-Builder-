"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils/cn";

interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-dark-200">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              `w-full appearance-none bg-dark-900 border text-dark-100
               text-sm rounded-lg px-3 py-2.5 pr-9 transition-all
               duration-200 focus:outline-none focus:ring-2
               focus:ring-brand-600/50 focus:border-brand-600
               cursor-pointer`,
              error
                ? "border-red-500/60"
                : "border-dark-700 hover:border-dark-600",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2
                       w-4 h-4 text-dark-400 pointer-events-none"
          />
        </div>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";