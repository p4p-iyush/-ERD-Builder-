"use client";

import { forwardRef } from "react";
import { cn } from "../../lib/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-dark-200">
            {label}
            {props.required && (
              <span className="text-red-400 ml-1">*</span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-dark-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              `w-full bg-dark-900 border text-dark-100 text-sm
               rounded-lg px-3 py-2.5 transition-all duration-200
               placeholder-dark-500 focus:outline-none
               focus:ring-2 focus:ring-brand-600/50 focus:border-brand-600`,
              error
                ? "border-red-500/60 focus:ring-red-500/30 focus:border-red-500"
                : "border-dark-700 hover:border-dark-600",
              leftIcon  && "pl-10",
              rightElement && "pr-10",
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 text-dark-400">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500/20
                             flex items-center justify-center text-[10px]">
              !
            </span>
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-xs text-dark-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";