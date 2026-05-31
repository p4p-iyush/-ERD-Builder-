"use client";

import { forwardRef } from "react";
import { cn } from "../../lib/utils/cn";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base = `
      inline-flex items-center justify-center gap-2 font-medium
      rounded-lg transition-all duration-200 focus:outline-none
      focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900
      disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
    `;

    const variants = {
      primary: `
        bg-brand-600 hover:bg-brand-500 text-white
        focus:ring-brand-500 shadow-glow-sm hover:shadow-glow
      `,
      secondary: `
        bg-dark-700 hover:bg-dark-600 text-dark-100
        border border-dark-600 focus:ring-dark-500
      `,
      ghost: `
        hover:bg-dark-700 text-dark-300 hover:text-dark-100
        focus:ring-dark-500
      `,
      danger: `
        bg-red-600/20 hover:bg-red-600/30 text-red-400
        border border-red-600/30 hover:border-red-500/50
        focus:ring-red-500
      `,
      outline: `
        bg-transparent hover:bg-dark-700 text-dark-200
        border border-dark-600 hover:border-dark-500
        focus:ring-dark-500
      `,
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 h-7",
      md: "text-sm px-4 py-2 h-9",
      lg: "text-base px-6 py-3 h-11",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";