import type { DiagramData } from "./diagram";

export interface Project {
  id: string;
  user_id: string;
  project_name: string;
  diagram: DiagramData;
  is_public: boolean;
  share_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary {
  id: string;
  project_name: string;
  is_public: boolean;
  share_id: string;
  created_at: string;
  updated_at: string;
  nodeCount: number;
  edgeCount: number;
}

export interface CreateProjectPayload {
  project_name: string;
  diagram?: DiagramData;
}

export interface UpdateProjectPayload {
  project_name?: string;
  diagram?: DiagramData;
  is_public?: boolean;
}