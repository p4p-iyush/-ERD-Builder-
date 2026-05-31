import type { Node, Edge, Viewport } from "@xyflow/react";
import type { Column } from "./column";
import type { RelationshipType, EdgeStyle } from "./relationship";

// ── Table data stored inside each React Flow node ──────────────────────────
export interface TableData {
  tableName: string;
  columns: Column[];
  color?: string;
  isHighlighted?: boolean;
  isFaded?: boolean;
  [key: string]: unknown; // React Flow requires index signature
}

// ── Relationship data stored inside each React Flow edge ───────────────────
export interface RelationshipData {
  relationshipType: RelationshipType;
  label?: string;
  style?: EdgeStyle;
  sourceColumnId?: string;
  targetColumnId?: string;
  isHighlighted?: boolean;
  [key: string]: unknown;
}

// ── Typed React Flow node & edge ───────────────────────────────────────────
export type TableNode = Node<TableData, "tableNode">;
export type RelationshipEdge = Edge<RelationshipData>;

// ── Full diagram stored in Supabase ───────────────────────────────────────
export interface DiagramData {
  nodes: TableNode[];
  edges: RelationshipEdge[];
  viewport?: Viewport;
}

// ── History snapshot for undo/redo ────────────────────────────────────────
export interface DiagramSnapshot {
  nodes: TableNode[];
  edges: RelationshipEdge[];
  timestamp: number;
}

// ── Table colors palette ──────────────────────────────────────────────────
export const TABLE_COLORS = [
  "#6270f1", // brand purple
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#84cc16", // lime
] as const;

export type TableColor = (typeof TABLE_COLORS)[number];