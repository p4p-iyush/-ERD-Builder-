import { cn } from "../../lib/utils/cn";

interface ColumnBadgeProps {
  type: "PK" | "FK" | "UQ" | "NN";
  className?: string;
}

const BADGE_STYLES: Record<ColumnBadgeProps["type"], string> = {
  PK: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  FK: "bg-blue-500/20  text-blue-400  border-blue-500/40",
  UQ: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  NN: "bg-red-500/15    text-red-400    border-red-500/30",
};

const BADGE_LABELS: Record<ColumnBadgeProps["type"], string> = {
  PK: "PK",
  FK: "FK",
  UQ: "UQ",
  NN: "NN",
};

export function ColumnBadge({ type, className }: ColumnBadgeProps) {
  return (
    <span
      className={cn(
        `inline-flex items-center justify-center w-6 h-4 rounded text-[9px]
         font-bold border leading-none shrink-0`,
        BADGE_STYLES[type],
        className
      )}
    >
      {BADGE_LABELS[type]}
    </span>
  );
}