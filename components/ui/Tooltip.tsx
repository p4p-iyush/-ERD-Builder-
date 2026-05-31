"use client";

import { useState, useRef } from "react";
import { cn } from "../../lib/utils/cn";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = "top",
  delay = 400,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timer.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };

  const positions = {
    top:    "-top-8 left-1/2 -translate-x-1/2",
    bottom: "-bottom-8 left-1/2 -translate-x-1/2",
    left:   "right-full top-1/2 -translate-y-1/2 mr-2",
    right:  "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && content && (
        <div
          className={cn(
            `absolute z-50 px-2 py-1 text-xs font-medium text-dark-100
             bg-dark-700 border border-dark-600 rounded-md shadow-dark-sm
             whitespace-nowrap pointer-events-none animate-fade-in`,
            positions[side],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}