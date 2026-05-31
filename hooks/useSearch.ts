"use client";

import { useMemo, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { useDiagramStore, useUIStore } from "../store";

export function useSearch() {
  const { nodes }             = useDiagramStore();
  const { searchQuery }       = useUIStore();
  const { setCenter, getZoom } = useReactFlow();

  const results = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return nodes.filter((n) =>
      n.data.tableName.toLowerCase().includes(q)
    );
  }, [nodes, searchQuery]);

  const focusNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const x = node.position.x + 120; // approx center of node
      const y = node.position.y + 80;
      const zoom = Math.max(getZoom(), 1);

      setCenter(x, y, { zoom, duration: 600 });
    },
    [nodes, setCenter, getZoom]
  );

  return { results, focusNode };
}