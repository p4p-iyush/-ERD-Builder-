"use client";

import { cn } from "../../lib/utils/cn";
import { TABLE_COLORS } from "../../types/diagram";
import { Check } from "lucide-react";

interface ColorPickerProps {
  value:    string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABLE_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={cn(
            `w-7 h-7 rounded-lg border-2 flex items-center
             justify-center transition-all duration-150
             hover:scale-110 active:scale-95`,
            value === color
              ? "border-white scale-110"
              : "border-transparent"
          )}
          style={{ backgroundColor: color }}
          title={color}
        >
          {value === color && (
            <Check className="w-3.5 h-3.5 text-white drop-shadow" />
          )}
        </button>
      ))}
    </div>
  );
}