"use client";

import { MiniMap } from "@xyflow/react";
import type { TableNode } from "../../types/diagram";

interface MiniMapPanelProps {
  nodes: TableNode[];
}

export function MiniMapPanel({ nodes }: MiniMapPanelProps) {
  return (
    <MiniMap
      nodeColor={(node) => {
        const tableNode = nodes.find((n) => n.id === node.id);
        return tableNode?.data?.color ?? "#6270f1";
      }}
      maskColor="rgba(10, 10, 10, 0.7)"
      style={{
        background: "rgba(20, 20, 20, 0.9)",
        border:     "1px solid #2e2e2e",
        borderRadius: "12px",
      }}
      nodeStrokeWidth={0}
      pannable
      zoomable
    />
  );
}