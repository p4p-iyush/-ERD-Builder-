import { cn } from "../../lib/utils/cn";

interface SkeletonProps {
  className?: string;
  variant?:   "rect" | "circle" | "text";
  lines?:     number;
}

export function Skeleton({
  className,
  variant = "rect",
  lines = 1,
}: SkeletonProps) {
  if (variant === "text") {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 rounded animate-pulse bg-dark-700",
              i === lines - 1 && lines > 1 && "w-3/4",
              className
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div
        className={cn(
          "rounded-full animate-pulse bg-dark-700",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl animate-pulse bg-dark-700",
        className
      )}
    />
  );
}

// ── Preset skeletons ──────────────────────────────────────────────────────
export function ProjectCardSkeleton() {
  return (
    <div className="rounded-2xl bg-dark-800 border border-dark-700 overflow-hidden">
      <Skeleton className="h-32 rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function TableNodeSkeleton() {
  return (
    <div className="rounded-xl bg-dark-800 border border-dark-700 min-w-[240px]">
      <div className="px-3 py-2.5 border-b border-dark-700">
        <Skeleton className="h-4 w-24" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="px-3 py-2 border-b border-dark-700/60">
          <Skeleton className="h-3" />
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-9" />
      <Skeleton className="h-9" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}