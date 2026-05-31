"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  SelectionMode,
  useReactFlow,
  type OnSelectionChangeParams,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useDiagramStore, useUIStore, useHistoryStore } from "../../store";
import { TableNode }        from "../../components/nodes/TableNode";
import { RelationshipEdge } from "../../components/edges/RelationshipEdge";
import { CanvasControls }   from "./CanvasControls";
import { MiniMapPanel }     from "./MiniMapPanel";
import type { TableNode as TableNodeType, RelationshipEdge as RelationshipEdgeType } from "../../types/diagram";

// ── Register custom types ──────────────────────────────────────────────────
const nodeTypes = { tableNode: TableNode } as const;
const edgeTypes = { relationshipEdge: RelationshipEdge } as const;

// ── Inner canvas (must be inside ReactFlowProvider) ────────────────────────
function CanvasInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodes,
    setSelectedEdges,
    setViewport,
  } = useDiagramStore();

  const { pushSnapshot } = useHistoryStore();
  const { openPanel }    = useUIStore();
  const { fitView }      = useReactFlow();

  const [isLocked, setIsLocked] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const reactFlowWrapper        = useRef<HTMLDivElement>(null);

  // Fit view after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.12, duration: 600 });
    }, 100);
    return () => clearTimeout(timer);
  }, [fitView]);

  // Track selection changes
  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: OnSelectionChangeParams) => {
      setSelectedNodes(selNodes.map((n) => n.id));
      setSelectedEdges(selEdges.map((e) => e.id));
    },
    [setSelectedNodes, setSelectedEdges]
  );

  // Push snapshot when drag ends
  const onNodeDragStop = useCallback(() => {
    pushSnapshot();
    useDiagramStore.setState({ isDirty: true });
  }, [pushSnapshot]);

  // Open relationship panel on edge click
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      openPanel("relationship", edge.id);
    },
    [openPanel]
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onNodeDragStop={onNodeDragStop}
        onEdgeClick={onEdgeClick}
        onMoveEnd={(_, viewport) => setViewport(viewport)}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag
        panOnDrag={[1, 2]}
        zoomOnScroll
        zoomOnPinch
        fitView
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
        deleteKeyCode={null}
        multiSelectionKeyCode="Shift"
        connectionRadius={40}
        translateExtent={[[-2000, -2000], [6000, 6000]]}
        nodeExtent={[[-1800, -1800], [5800, 5800]]}
        snapToGrid={false}
        elevateNodesOnSelect
        defaultEdgeOptions={{
          type:     "relationshipEdge",
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
        className="bg-dark-950"
      >
        {/* Grid background */}
        {showGrid && (
          <>
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
          </>
        )}

        {/* Minimap */}
        <MiniMapPanel nodes={nodes as TableNodeType[]} />

        {/* Canvas controls — bottom right */}
        <div className="absolute bottom-6 right-4 z-10">
          <CanvasControls
            isLocked={isLocked}
            showGrid={showGrid}
            onToggleLock={() => setIsLocked((l) => !l)}
            onToggleGrid={() => setShowGrid((g) => !g)}
          />
        </div>
      </ReactFlow>
    </div>
  );
}

// ── Public export (wraps with ReactFlowProvider) ───────────────────────────
export function ERDCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}