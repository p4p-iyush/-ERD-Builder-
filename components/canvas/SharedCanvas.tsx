"use client";

import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TableNode }        from "./../../components/nodes/TableNode";
import { RelationshipEdge } from "./../../components/edges/RelationshipEdge";
import type { DiagramData, TableNode as TableNodeType } from "../../types/diagram";

const nodeTypes = { tableNode: TableNode } as const;
const edgeTypes = { relationshipEdge: RelationshipEdge } as const;

// ── Inner (needs ReactFlowProvider) ───────────────────────────────────────
function SharedCanvasInner({ diagram }: { diagram: DiagramData }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const t = setTimeout(() => {
      fitView({ padding: 0.12, duration: 600 });
    }, 200);
    return () => clearTimeout(t);
  }, [fitView]);

  const nodes = useMemo(() =>
    (diagram.nodes ?? []).map((n) => ({
      ...n,
      draggable:   false,
      selectable:  false,
      connectable: false,
    })),
    [diagram.nodes]
  );

  const edges = useMemo(() =>
    (diagram.edges ?? []).map((e) => ({
      ...e,
      selectable: false,
    })),
    [diagram.edges]
  );

  return (
    <div className="w-full h-full absolute inset-0">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        fitView
        fitViewOptions={{ padding: 0.12 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "relationshipEdge" }}
        className="bg-dark-950"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#2a2a2a"
        />
        <Background
          variant={BackgroundVariant.Lines}
          gap={96}
          size={1}
          color="#1e1e1e"
          style={{ opacity: 0.4 }}
        />
        <MiniMap
          nodeColor={(node) => {
            const n = nodes.find((nd) => nd.id === node.id) as TableNodeType | undefined;
            return n?.data?.color ?? "#6270f1";
          }}
          maskColor="rgba(10,10,10,0.7)"
          style={{
            background:   "rgba(20,20,20,0.9)",
            border:       "1px solid #2e2e2e",
            borderRadius: "12px",
          }}
          nodeStrokeWidth={0}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────
export function SharedCanvas({ diagramJSON }: { diagramJSON: string }) {
  const diagram = useMemo<DiagramData>(() => {
    try {
      return JSON.parse(diagramJSON);
    } catch {
      return { nodes: [], edges: [] };
    }
  }, [diagramJSON]);

  return (
    <ReactFlowProvider>
      <SharedCanvasInner diagram={diagram} />
    </ReactFlowProvider>
  );
}