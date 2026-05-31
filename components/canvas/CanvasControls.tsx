"use client";

import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  ZoomIn, ZoomOut, Maximize2, Lock, Unlock, Grid3x3,
} from "lucide-react";
import { Tooltip } from "../../components/ui/Tooltip";
import { cn } from "../../lib/utils/cn";

interface CanvasControlsProps {
  isLocked: boolean;
  showGrid: boolean;
  onToggleLock: () => void;
  onToggleGrid: () => void;
}

export function CanvasControls({
  isLocked,
  showGrid,
  onToggleLock,
  onToggleGrid,
}: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.1, duration: 600 });
  }, [fitView]);

  const buttons = [
    {
      icon: <ZoomIn className="w-4 h-4" />,
      label: "Zoom in",
      onClick: () => zoomIn({ duration: 200 }),
    },
    {
      icon: <ZoomOut className="w-4 h-4" />,
      label: "Zoom out",
      onClick: () => zoomOut({ duration: 200 }),
    },
    {
      icon: <Maximize2 className="w-4 h-4" />,
      label: "Fit to screen",
      onClick: handleFitView,
    },
  ];

  return (
    <div className="flex flex-col gap-1 p-1 bg-dark-800/90 backdrop-blur-md
                    border border-dark-700 rounded-xl shadow-dark-sm">
      {buttons.map((btn) => (
        <Tooltip key={btn.label} content={btn.label} side="left">
          <button
            onClick={btn.onClick}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       text-dark-400 hover:text-dark-100 hover:bg-dark-700
                       transition-all duration-150"
          >
            {btn.icon}
          </button>
        </Tooltip>
      ))}

      <div className="w-full h-px bg-dark-700 my-0.5" />

      <Tooltip content={isLocked ? "Unlock canvas" : "Lock canvas"} side="left">
        <button
          onClick={onToggleLock}
          className={cn(
            `w-8 h-8 flex items-center justify-center rounded-lg
             transition-all duration-150`,
            isLocked
              ? "bg-brand-600/20 text-brand-400"
              : "text-dark-400 hover:text-dark-100 hover:bg-dark-700"
          )}
        >
          {isLocked
            ? <Lock   className="w-4 h-4" />
            : <Unlock className="w-4 h-4" />
          }
        </button>
      </Tooltip>

      <Tooltip content={showGrid ? "Hide grid" : "Show grid"} side="left">
        <button
          onClick={onToggleGrid}
          className={cn(
            `w-8 h-8 flex items-center justify-center rounded-lg
             transition-all duration-150`,
            showGrid
              ? "bg-brand-600/20 text-brand-400"
              : "text-dark-400 hover:text-dark-100 hover:bg-dark-700"
          )}
        >
          <Grid3x3 className="w-4 h-4" />
        </button>
      </Tooltip>
    </div>
  );
}