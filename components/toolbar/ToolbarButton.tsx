"use client";

import { forwardRef } from "react";
import { Tooltip } from "../../components/ui/Tooltip";
import { cn } from "../../lib/utils/cn";

interface ToolbarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  isActive?: boolean;
  variant?: "default" | "danger" | "success";
  badge?: number;
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  (
    {
      icon,
      label,
      shortcut,
      isActive,
      variant = "default",
      badge,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const tooltipContent = shortcut ? `${label} (${shortcut})` : label;

    const variants = {
      default: cn(
        "text-dark-400 hover:text-dark-100 hover:bg-dark-700/80",
        isActive && "bg-brand-600/20 text-brand-400 hover:bg-brand-600/30"
      ),
      danger: "text-dark-400 hover:text-red-400 hover:bg-red-500/10",
      success: cn(
        "text-dark-400 hover:text-emerald-400 hover:bg-emerald-500/10",
        isActive && "bg-emerald-600/20 text-emerald-400"
      ),
    };

    return (
      <Tooltip content={tooltipContent} side="bottom" delay={500}>
        <button
          ref={ref}
          disabled={disabled}
          className={cn(
            `relative w-9 h-9 flex items-center justify-center
             rounded-lg transition-all duration-150
             disabled:opacity-40 disabled:cursor-not-allowed
             active:scale-90`,
            variants[variant],
            className
          )}
          {...props}
        >
          {icon}
          {badge !== undefined && badge > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4
                         bg-brand-600 text-white text-[9px] font-bold
                         rounded-full flex items-center justify-center
                         leading-none"
            >
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </button>
      </Tooltip>
    );
  }
);

ToolbarButton.displayName = "ToolbarButton";