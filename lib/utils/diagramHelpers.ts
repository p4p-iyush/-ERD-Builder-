import type { TableNode, RelationshipEdge, DiagramData } from "../../types/diagram";
import type { ProjectSummary } from "../../types/project";

export function buildDiagramData(
  nodes: TableNode[],
  edges: RelationshipEdge[]
): DiagramData {
  return { nodes, edges };
}

export function projectToSummary(project: {
  id: string;
  project_name: string;
  is_public: boolean;
  share_id: string;
  created_at: string;
  updated_at: string;
  diagram: DiagramData;
}): ProjectSummary {
  return {
    id: project.id,
    project_name: project.project_name,
    is_public: project.is_public,
    share_id: project.share_id,
    created_at: project.created_at,
    updated_at: project.updated_at,
    nodeCount: project.diagram?.nodes?.length ?? 0,
    edgeCount: project.diagram?.edges?.length ?? 0,
  };
}

export function formatRelativeTime(dateStr: string): string {
  const date  = new Date(dateStr);
  const now   = new Date();
  const diff  = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60)                    return "just now";
  if (diff < 3600)                  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)                 return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)                return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}