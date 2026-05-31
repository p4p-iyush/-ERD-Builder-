"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  type Viewport,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import type {
  TableNode,
  RelationshipEdge,
  DiagramData,
  TableData,
} from "../types/diagram";
import type { Column, DataType } from "../types/column";
import type { RelationshipType } from "../types/relationship";
import { TABLE_COLORS } from "../types/diagram";

interface DiagramStore {
  // State
  nodes: TableNode[];
  edges: RelationshipEdge[];
  viewport: Viewport;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  hoveredNodeId: string | null;
  isDirty: boolean;
  lastSavedAt: Date | null;
  copiedNodes: TableNode[] | null;

  // React Flow handlers
  onNodesChange: OnNodesChange<TableNode>;
  onEdgesChange: OnEdgesChange<RelationshipEdge>;
  onConnect: OnConnect;

  // Diagram actions
  setDiagram: (data: DiagramData) => void;
  setViewport: (viewport: Viewport) => void;
  markClean: () => void;

  // Table actions
  addTable: (position?: { x: number; y: number }) => string;
  updateTableName: (nodeId: string, name: string) => void;
  deleteTable: (nodeId: string) => void;
  duplicateTable: (nodeId: string) => void;
  updateTableColor: (nodeId: string, color: string) => void;
  setHighlighted: (nodeId: string | null) => void;

  // Column actions
  addColumn: (nodeId: string) => void;
  updateColumn: (
    nodeId: string,
    columnId: string,
    updates: Partial<Column>,
  ) => void;
  deleteColumn: (nodeId: string, columnId: string) => void;
  reorderColumns: (nodeId: string, columns: Column[]) => void;

  // Edge actions
  addRelationship: (
    sourceNodeId: string,
    targetNodeId: string,
    type: RelationshipType,
  ) => void;
  updateRelationship: (
    edgeId: string,
    updates: Partial<{ label: string; relationshipType: RelationshipType }>,
  ) => void;
  deleteRelationship: (edgeId: string) => void;

  // Selection actions
  setSelectedNodes: (ids: string[]) => void;
  setSelectedEdges: (ids: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Copy/Paste actions
  copySelected: () => void;
  pasteNodes: () => void;

  // Delete selected
  deleteSelected: () => void;
}

const DEFAULT_COLUMN = (order: number): Column => ({
  id: uuidv4(),
  name: `column_${order + 1}`,
  dataType: "string" as DataType,
  isPrimaryKey: false,
  isForeignKey: false,
  isUnique: false,
  isNullable: true,
  order,
});

const PK_COLUMN = (): Column => ({
  id: uuidv4(),
  name: "id",
  dataType: "uuid",
  isPrimaryKey: true,
  isForeignKey: false,
  isUnique: true,
  isNullable: false,
  defaultValue: "uuid_generate_v4()",
  order: 0,
});

let tableCounter = 1;

export const useDiagramStore = create<DiagramStore>()(
  subscribeWithSelector((set, get) => ({
    // ── Initial state ──────────────────────────────────────────────────────
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedNodeIds: [],
    selectedEdgeIds: [],
    hoveredNodeId: null,
    isDirty: false,
    lastSavedAt: null,
    copiedNodes: null,

    // ── React Flow handlers ────────────────────────────────────────────────
    onNodesChange: (changes: NodeChange<TableNode>[]) => {
      set((state) => ({
        nodes: applyNodeChanges(changes, state.nodes),
        isDirty: true,
      }));
    },

    onEdgesChange: (changes: EdgeChange<RelationshipEdge>[]) => {
      set((state) => ({
        edges: applyEdgeChanges(changes, state.edges),
        isDirty: true,
      }));
    },

    onConnect: (connection: Connection) => {
      const newEdge: RelationshipEdge = {
        ...connection,
        id: uuidv4(),
        type: "relationshipEdge",
        data: {
          relationshipType: "one-to-many",
          label: "",
          style: "curved",
        },
        animated: false,
      };
      set((state) => ({
        edges: addEdge(newEdge, state.edges),
        isDirty: true,
      }));
    },

    // ── Diagram actions ────────────────────────────────────────────────────
    setDiagram: (data: DiagramData) => {
      set({
        nodes: data.nodes ?? [],
        edges: data.edges ?? [],
        viewport: data.viewport ?? { x: 0, y: 0, zoom: 1 },
        isDirty: false,
      });
    },

    setViewport: (viewport) => set({ viewport }),

    markClean: () => set({ isDirty: false, lastSavedAt: new Date() }),

    // ── Table actions ──────────────────────────────────────────────────────
    addTable: (position) => {
      const id = uuidv4();
      const colorIndex = tableCounter % TABLE_COLORS.length;
      const newNode: TableNode = {
        id,
        type: "tableNode",
        position: position ?? {
          x: 100 + Math.random() * 400,
          y: 100 + Math.random() * 300,
        },
        data: {
          tableName: `table_${tableCounter}`,
          columns: [PK_COLUMN()],
          color: TABLE_COLORS[colorIndex],
          isHighlighted: false,
          isFaded: false,
        },
      };
      tableCounter++;
      set((state) => ({
        nodes: [...state.nodes, newNode],
        isDirty: true,
      }));
      return id;
    },

    updateTableName: (nodeId, name) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, tableName: name } } : n,
        ),
        isDirty: true,
      }));
    },

    deleteTable: (nodeId) => {
      set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== nodeId),
        edges: state.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId,
        ),
        isDirty: true,
      }));
    },

    duplicateTable: (nodeId) => {
      const state = get();
      const original = state.nodes.find((n) => n.id === nodeId);
      if (!original) return;

      const newId = uuidv4();
      const duplicate: TableNode = {
        ...original,
        id: newId,
        position: {
          x: original.position.x + 40,
          y: original.position.y + 40,
        },
        data: {
          ...original.data,
          tableName: `${original.data.tableName}_copy`,
          columns: original.data.columns.map((col: Column) => ({
            ...col,
            id: uuidv4(),
          })),
        },
        selected: false,
      };

      set((state) => ({
        nodes: [...state.nodes, duplicate],
        isDirty: true,
      }));
    },

    updateTableColor: (nodeId, color) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, color } } : n,
        ),
        isDirty: true,
      }));
    },

    setHighlighted: (nodeId) => {
      set((state) => {
        if (!nodeId) {
          return {
            nodes: state.nodes.map((n) => ({
              ...n,
              data: { ...n.data, isHighlighted: false, isFaded: false },
            })),
            edges: state.edges.map((e) => ({
              ...e,
              data: { ...e.data, isHighlighted: false },
            })),
            hoveredNodeId: null,
          } as Partial<DiagramStore>;
        }

        // Find all connected node IDs
        const connectedIds = new Set<string>([nodeId]);
        state.edges.forEach((e) => {
          if (e.source === nodeId) connectedIds.add(e.target);
          if (e.target === nodeId) connectedIds.add(e.source);
        });

        return {
          hoveredNodeId: nodeId,
          nodes: state.nodes.map((n) => ({
            ...n,
            data: {
              ...n.data,
              isHighlighted: connectedIds.has(n.id),
              isFaded: !connectedIds.has(n.id),
            },
          })),
          edges: state.edges.map((e) => ({
            ...e,
            data: {
              ...e.data,
              isHighlighted: e.source === nodeId || e.target === nodeId,
            },
          })),
        } as Partial<DiagramStore>;
      });
    },

    // ── Column actions ─────────────────────────────────────────────────────
    addColumn: (nodeId) => {
      set((state) => ({
        nodes: state.nodes.map((n) => {
          if (n.id !== nodeId) return n;
          const newCol = DEFAULT_COLUMN(n.data.columns.length);
          return {
            ...n,
            data: {
              ...n.data,
              columns: [...n.data.columns, newCol],
            },
          };
        }),
        isDirty: true,
      }));
    },

    updateColumn: (nodeId, columnId, updates) => {
      set((state) => ({
        nodes: state.nodes.map((n) => {
          if (n.id !== nodeId) return n;
          return {
            ...n,
            data: {
              ...n.data,
              columns: n.data.columns.map((col: Column) =>
                col.id === columnId ? { ...col, ...updates } : col,
              ),
            },
          };
        }),
        isDirty: true,
      }));
    },

    deleteColumn: (nodeId, columnId) => {
      set((state) => ({
        nodes: state.nodes.map((n) => {
          if (n.id !== nodeId) return n;
          return {
            ...n,
            data: {
              ...n.data,
              columns: n.data.columns
                .filter((col: Column) => col.id !== columnId)
                .map((col: Column, i: number) => ({ ...col, order: i })),
            },
          };
        }),
        isDirty: true,
      }));
    },

    reorderColumns: (nodeId, columns) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, columns } } : n,
        ),
        isDirty: true,
      }));
    },

    // ── Edge actions ───────────────────────────────────────────────────────
    addRelationship: (sourceNodeId, targetNodeId, type) => {
      const newEdge: RelationshipEdge = {
        id: uuidv4(),
        source: sourceNodeId,
        target: targetNodeId,
        type: "relationshipEdge",
        data: {
          relationshipType: type,
          label: "",
          style: "curved",
        },
      };
      set((state) => ({
        edges: [...state.edges, newEdge],
        isDirty: true,
      }));
    },

    updateRelationship: (edgeId, updates) => {
      set((state) => ({
        edges: state.edges.map((e) => {
          if (e.id !== edgeId || !e.data) return e;

          const updatedData: RelationshipEdge["data"] = {
            ...e.data,
            label: updates.label !== undefined ? updates.label : e.data.label,
            relationshipType:
              updates.relationshipType !== undefined
                ? updates.relationshipType
                : e.data.relationshipType,
          };

          return {
            ...e,
            data: updatedData,
          };
        }),
        isDirty: true,
      }));
    },

    deleteRelationship: (edgeId) => {
      set((state) => ({
        edges: state.edges.filter((e) => e.id !== edgeId),
        isDirty: true,
      }));
    },

    // ── Selection actions ──────────────────────────────────────────────────
    setSelectedNodes: (ids) => set({ selectedNodeIds: ids }),
    setSelectedEdges: (ids) => set({ selectedEdgeIds: ids }),

    selectAll: () => {
      const { nodes, edges } = get();
      set({
        selectedNodeIds: nodes.map((n) => n.id),
        selectedEdgeIds: edges.map((e) => e.id),
        nodes: nodes.map((n) => ({ ...n, selected: true })),
        edges: edges.map((e) => ({ ...e, selected: true })),
      });
    },

    clearSelection: () => {
      set((state) => ({
        selectedNodeIds: [],
        selectedEdgeIds: [],
        nodes: state.nodes.map((n) => ({ ...n, selected: false })),
        edges: state.edges.map((e) => ({ ...e, selected: false })),
      }));
    },

    // ── Copy / Paste ───────────────────────────────────────────────────────
    copySelected: () => {
      const { nodes, selectedNodeIds } = get();
      const copied = nodes.filter((n) => selectedNodeIds.includes(n.id));
      if (copied.length > 0) set({ copiedNodes: copied });
    },

    pasteNodes: () => {
      const { copiedNodes } = get();
      if (!copiedNodes || copiedNodes.length === 0) return;

      const newNodes: TableNode[] = copiedNodes.map((n) => ({
        ...n,
        id: uuidv4(),
        position: { x: n.position.x + 30, y: n.position.y + 30 },
        selected: true,
        data: {
          ...n.data,
          tableName: `${n.data.tableName}_copy`,
          columns: n.data.columns.map((col: Column) => ({
            ...col,
            id: uuidv4(),
          })),
        },
      }));

      set((state) => ({
        nodes: [
          ...state.nodes.map((n) => ({ ...n, selected: false })),
          ...newNodes,
        ],
        selectedNodeIds: newNodes.map((n) => n.id),
        isDirty: true,
      }));
    },

    // ── Delete selected ────────────────────────────────────────────────────
    deleteSelected: () => {
      const { selectedNodeIds, selectedEdgeIds } = get();
      set((state) => ({
        nodes: state.nodes.filter((n) => !selectedNodeIds.includes(n.id)),
        edges: state.edges.filter(
          (e) =>
            !selectedEdgeIds.includes(e.id) &&
            !selectedNodeIds.includes(e.source) &&
            !selectedNodeIds.includes(e.target),
        ),
        selectedNodeIds: [],
        selectedEdgeIds: [],
        isDirty: true,
      }));
    },
  })),
);
