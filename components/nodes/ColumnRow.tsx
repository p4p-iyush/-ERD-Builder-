"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ColumnBadge } from "./ColumnBadge";
import { cn } from "../../lib/utils/cn";
import { getDataTypeColor, getDataTypeLabel } from "../../lib/constants/dataTypes";
import type { Column } from "../../types/column";

interface ColumnRowProps {
  column: Column;
  isFirst?: boolean;
  isLast?: boolean;
  nodeId: string;
  isHighlighted?: boolean;
}

export const ColumnRow = memo(function ColumnRow({
  column,
  isFirst,
  isLast,
  nodeId,
  isHighlighted,
}: ColumnRowProps) {
  const typeColor = getDataTypeColor(column.dataType);
  const typeLabel = getDataTypeLabel(column.dataType);

  return (
    <div
      className={cn(
        `relative flex items-center gap-2 px-3 py-[7px] text-xs
         transition-colors duration-150 group/col
         hover:bg-white/5`,
        column.isPrimaryKey && "bg-amber-500/5",
        isFirst && "rounded-t-none",
        isLast && "rounded-b-xl"
      )}
    >
      {/* Source handle (left) */}
      <Handle
        type="source"
        position={Position.Left}
        id={`${nodeId}-${column.id}-left`}
        className={cn(
          `!w-2.5 !h-2.5 !rounded-full !border-2 !left-[-5px]
           !opacity-0 group-hover/col:!opacity-100
           transition-opacity duration-150`,
          isHighlighted
            ? "!bg-brand-400 !border-brand-600"
            : "!bg-dark-600 !border-dark-500"
        )}
      />

      {/* Badges */}
      <div className="flex items-center gap-1 w-[52px] shrink-0">
        {column.isPrimaryKey  && <ColumnBadge type="PK" />}
        {column.isForeignKey  && <ColumnBadge type="FK" />}
        {column.isUnique && !column.isPrimaryKey && <ColumnBadge type="UQ" />}
        {!column.isNullable && !column.isPrimaryKey && (
          <ColumnBadge type="NN" />
        )}
      </div>

      {/* Column name */}
      <span
        className={cn(
          "flex-1 truncate font-medium",
          column.isPrimaryKey ? "text-amber-300" : "text-dark-200"
        )}
      >
        {column.name}
      </span>

      {/* Data type */}
      <span
        className="text-[10px] font-mono shrink-0 opacity-70"
        style={{ color: typeColor }}
      >
        {typeLabel}
      </span>

      {/* Target handle (right) */}
      <Handle
        type="target"
        position={Position.Right}
        id={`${nodeId}-${column.id}-right`}
        className={cn(
          `!w-2.5 !h-2.5 !rounded-full !border-2 !right-[-5px]
           !opacity-0 group-hover/col:!opacity-100
           transition-opacity duration-150`,
          isHighlighted
            ? "!bg-brand-400 !border-brand-600"
            : "!bg-dark-600 !border-dark-500"
        )}
      />
    </div>
  );
});