// lib/utils/autoLayout.ts
import type { TableNode, RelationshipEdge } from "../../types/diagram";

// ── Constants ─────────────────────────────────────────────────────────────
const NODE_WIDTH  = 280;
const NODE_HEIGHT = 200; // base height, real height varies by column count
const H_GAP       = 80;  // horizontal gap between nodes
const V_GAP       = 100; // vertical gap between levels

// Estimate node height by column count
function estimateHeight(node: TableNode): number {
  const cols = node.data.columns?.length ?? 1;
  return Math.max(120, 48 + cols * 32);
}

// ── Check if current layout has overlapping nodes ─────────────────────────
export function hasOverlappingNodes(nodes: TableNode[]): boolean {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const aH = estimateHeight(a);
      const bH = estimateHeight(b);

      const overlapX =
        a.position.x < b.position.x + NODE_WIDTH + 20 &&
        a.position.x + NODE_WIDTH + 20 > b.position.x;
      const overlapY =
        a.position.y < b.position.y + bH + 20 &&
        a.position.y + aH + 20 > b.position.y;

      if (overlapX && overlapY) return true;
    }
  }
  return false;
}

// ── Main hierarchical layout ──────────────────────────────────────────────
export function computeHierarchicalLayout(
  nodes: TableNode[],
  edges: RelationshipEdge[]
): Array<{ id: string; position: { x: number; y: number } }> {
  if (nodes.length === 0) return [];

  const nodeIds = new Set(nodes.map((n) => n.id));

  // ── 1. Build adjacency: parent → children (FK source → target) ──────────
  const children  = new Map<string, Set<string>>();
  const parents   = new Map<string, Set<string>>();

  for (const node of nodes) {
    children.set(node.id, new Set());
    parents.set(node.id, new Set());
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    if (edge.source === edge.target) continue;
    children.get(edge.source)?.add(edge.target);
    parents.get(edge.target)?.add(edge.source);
  }

  // ── 2. Assign depth levels via BFS from roots ────────────────────────────
  // Roots = nodes with no incoming edges
  const roots = nodes
    .filter((n) => (parents.get(n.id)?.size ?? 0) === 0)
    .map((n) => n.id);

  // If no roots (circular), pick the most-connected node
  const startNodes =
    roots.length > 0
      ? roots
      : [nodes.reduce((a, b) =>
          (children.get(a.id)?.size ?? 0) >= (children.get(b.id)?.size ?? 0)
            ? a : b
        ).id];

  const levelMap = new Map<string, number>();
  const queue: Array<{ id: string; level: number }> = startNodes.map((id) => ({
    id,
    level: 0,
  }));

  // BFS
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    // Only update if this gives a deeper level (handles diamonds)
    if (!levelMap.has(id) || levelMap.get(id)! < level) {
      levelMap.set(id, level);
      for (const childId of children.get(id) ?? []) {
        queue.push({ id: childId, level: level + 1 });
      }
    }
  }

  // Any unvisited nodes (disconnected) go on their own level
  let maxLevel = Math.max(0, ...levelMap.values());
  for (const node of nodes) {
    if (!levelMap.has(node.id)) {
      levelMap.set(node.id, ++maxLevel);
    }
  }

  // ── 3. Group nodes by level ───────────────────────────────────────────────
  const levelGroups = new Map<number, string[]>();
  for (const [id, level] of levelMap) {
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(id);
  }

  const totalLevels = Math.max(...levelGroups.keys()) + 1;

  // ── 4. Sort nodes within each level by parent X position ─────────────────
  // We do two passes: first assign X based on parent center, then spread

  // Pass 1: compute raw X position per node (average of parent X positions)
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const posX = new Map<string, number>();
  const posY = new Map<string, number>();

  // Assign Y first (level * (max_height + gap))
  for (const [level, ids] of levelGroups) {
    const levelH = Math.max(
      ...ids.map((id) => estimateHeight(nodeMap.get(id)!))
    );
    for (const id of ids) {
      posY.set(id, level * (levelH + V_GAP));
    }
  }

  // Assign X: sort each level's nodes by their parent's X, then space evenly
  for (let level = 0; level < totalLevels; level++) {
    const ids = levelGroups.get(level) ?? [];
    if (ids.length === 0) continue;

    // Sort by parent X position for better edge routing
    ids.sort((a, b) => {
      const aParents = Array.from(parents.get(a) ?? []);
      const bParents = Array.from(parents.get(b) ?? []);
      const aX = aParents.length > 0
        ? Math.min(...aParents.map((p) => posX.get(p) ?? 0))
        : 0;
      const bX = bParents.length > 0
        ? Math.min(...bParents.map((p) => posX.get(p) ?? 0))
        : 0;
      return aX - bX;
    });

    // Total width of this level
    const totalWidth =
      ids.length * NODE_WIDTH + (ids.length - 1) * H_GAP;

    // Center the level horizontally
    const startX = -totalWidth / 2;

    ids.forEach((id, i) => {
      posX.set(id, startX + i * (NODE_WIDTH + H_GAP));
    });
  }

  // ── 5. Return positions ───────────────────────────────────────────────────
  return nodes.map((node) => ({
    id: node.id,
    position: {
      x: posX.get(node.id) ?? 0,
      y: posY.get(node.id) ?? 0,
    },
  }));
}