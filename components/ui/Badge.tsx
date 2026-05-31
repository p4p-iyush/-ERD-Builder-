import { cn } from "../../lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "pk" | "fk" | "unique" | "nullable" | "type";
  className?: string;
  color?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
  color,
}: BadgeProps) {
  const variants = {
    default:  "bg-dark-700 text-dark-300 border-dark-600",
    pk:       "bg-amber-500/20 text-amber-400 border-amber-500/30",
    fk:       "bg-blue-500/20 text-blue-400 border-blue-500/30",
    unique:   "bg-purple-500/20 text-purple-400 border-purple-500/30",
    nullable: "bg-dark-700 text-dark-400 border-dark-600",
    type:     "bg-dark-800 text-dark-300 border-dark-700 font-mono",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px]",
        "font-medium border leading-none",
        variants[variant],
        className
      )}
      style={color ? { color, borderColor: `${color}40`,
                       backgroundColor: `${color}20` } : undefined}
    >
      {children}
    </span>
  );
}