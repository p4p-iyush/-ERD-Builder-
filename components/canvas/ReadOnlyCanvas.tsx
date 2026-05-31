"use client";

import { useEffect } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TableNode }        from "../../components/nodes/TableNode";
import { RelationshipEdge } from "../../components/edges/RelationshipEdge";
import { MiniMapPanel }     from "./MiniMapPanel";
import { CanvasControls }   from "./CanvasControls";
import type { DiagramData } from "../../types/diagram";

const nodeTypes = { tableNode: TableNode }        as const;
const edgeTypes = { relationshipEdge: RelationshipEdge } as const;

function ReadOnlyInner({ diagram }: { diagram: DiagramData }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.12, duration: 600 }), 100);
    return () => clearTimeout(t);
  }, [fitView]);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={diagram.nodes}
        edges={diagram.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-dark-950"
        defaultEdgeOptions={{ type: "relationshipEdge" }}
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
        <MiniMapPanel nodes={diagram.nodes} />

        {/* Read-only controls */}
        <div className="absolute bottom-6 right-4 z-10">
          <CanvasControls
            isLocked={true}
            showGrid={true}
            onToggleLock={() => {}}
            onToggleGrid={() => {}}
          />
        </div>
      </ReactFlow>
    </div>
  );
}

export function ReadOnlyCanvas({ diagram }: { diagram: DiagramData }) {
  return (
    <ReactFlowProvider>
      <ReadOnlyInner diagram={diagram} />
    </ReactFlowProvider>
  );
}