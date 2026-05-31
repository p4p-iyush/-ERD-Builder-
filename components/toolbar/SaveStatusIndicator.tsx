"use client";

import { Cloud, CloudOff, Loader2, CheckCircle2 } from "lucide-react";
import { useUIStore } from "../../store";
import { Tooltip } from "../../components/ui/Tooltip";
import { cn } from "../../lib/utils/cn";

interface SaveStatusIndicatorProps {
  onSave: () => void;
}

export function SaveStatusIndicator({ onSave }: SaveStatusIndicatorProps) {
  const { saveStatus } = useUIStore();

  const config = {
    idle: {
      icon:  <Cloud className="w-3.5 h-3.5" />,
      label: "Saved",
      color: "text-dark-500",
      text:  "All changes saved",
    },
    saving: {
      icon:  <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: "Saving…",
      color: "text-brand-400",
      text:  "Saving…",
    },
    saved: {
      icon:  <CheckCircle2 className="w-3.5 h-3.5" />,
      label: "Saved",
      color: "text-emerald-400",
      text:  "Saved",
    },
    error: {
      icon:  <CloudOff className="w-3.5 h-3.5" />,
      label: "Save failed",
      color: "text-red-400",
      text:  "Save failed — click to retry",
    },
  };

  const current = config[saveStatus];

  return (
    <Tooltip content={current.text} side="top">
      <button
        onClick={saveStatus === "error" ? onSave : undefined}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs",
          "font-medium transition-all duration-200",
          current.color,
          saveStatus === "error" && "hover:bg-red-500/10 cursor-pointer"
        )}
      >
        {current.icon}
        <span className="hidden sm:inline">{current.label}</span>
      </button>
    </Tooltip>
  );
}