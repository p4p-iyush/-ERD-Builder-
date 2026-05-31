"use client";

import { memo, useCallback } from "react";
import { NodeProps } from "@xyflow/react";
import { TableHeader } from "./TableHeader";
import { ColumnRow } from "./ColumnRow";
import { useDiagramStore } from "../../store";
import { cn } from "../../lib/utils/cn";
import type { TableNode as TableNodeType } from "../../types/diagram";
import { useUIStore } from "../../store";
export const TableNode = memo(function TableNode({
  id,
  data,
  selected,
}: NodeProps<TableNodeType>) {
  const { setHighlighted } = useDiagramStore();

  const handleMouseEnter = useCallback(() => {
    setHighlighted(id);
  }, [id, setHighlighted]);

  const handleMouseLeave = useCallback(() => {
    setHighlighted(null);
  }, [setHighlighted]);

  const {
    tableName,
    columns,
    color = "#6270f1",
    isHighlighted,
    isFaded,
  } = data;

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const { openPanel, activePanel, activePanelNodeId } = useUIStore();

  const handleNodeClick = useCallback(() => {
    // Toggle panel — close if already open for this node
    if (activePanel === "tableProperties" && activePanelNodeId === id) {
      // leave open
    } else {
      openPanel("tableProperties", id);
    }
  }, [id, openPanel, activePanel, activePanelNodeId]);
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleNodeClick}
      className={cn(
        `rounded-xl border min-w-[240px] max-w-[340px]
     shadow-dark-sm transition-all duration-300 overflow-visible
     cursor-pointer`,
        selected ? "ring-2 ring-offset-1 ring-offset-transparent" : "",
        isHighlighted && !isFaded ? "shadow-lg scale-[1.02]" : "",
        isFaded ? "opacity-30 scale-[0.98]" : "opacity-100",
        "bg-dark-800",
      )}
      style={{
        borderColor: selected
          ? color
          : isHighlighted
            ? `${color}80`
            : "#2e2e2e",
        boxShadow: selected
          ? `0 0 0 2px ${color}40, 0 8px 32px rgba(0,0,0,0.4)`
          : isHighlighted
            ? `0 0 20px ${color}25, 0 4px 16px rgba(0,0,0,0.3)`
            : undefined,
      }}
    >
      {/* Header */}
      <TableHeader
        nodeId={id}
        tableName={tableName}
        color={color}
        columnCount={columns.length}
        isHighlighted={isHighlighted}
        isFaded={isFaded}
      />

      {/* Columns */}
      <div className="divide-y divide-dark-700/60">
        {sortedColumns.length === 0 ? (
          <div
            className="px-4 py-3 text-xs text-dark-500 italic
                          text-center rounded-b-xl"
          >
            No columns — click + to add
          </div>
        ) : (
          sortedColumns.map((column, idx) => (
            <ColumnRow
              key={column.id}
              column={column}
              nodeId={id}
              isFirst={idx === 0}
              isLast={idx === sortedColumns.length - 1}
              isHighlighted={isHighlighted}
            />
          ))
        )}
      </div>

      {/* Bottom accent bar */}
      <div
        className="h-0.5 rounded-b-xl opacity-40"
        style={{ backgroundColor: color }}
      />
    </div>
  );
});
