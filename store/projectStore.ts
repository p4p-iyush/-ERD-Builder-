"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Project, ProjectSummary } from "../types/project";

interface ProjectStore {
  // State
  currentProject: Project | null;
  projects: ProjectSummary[];
  isLoading: boolean;
  error: string | null;
  recentProjectIds: string[];

  // Actions
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: ProjectSummary[]) => void;
  updateCurrentProjectName: (name: string) => void;
  addToRecent: (projectId: string) => void;
  removeProject: (projectId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      // ── Initial state ────────────────────────────────────────────────────
      currentProject: null,
      projects: [],
      isLoading: false,
      error: null,
      recentProjectIds: [],

      // ── Actions ──────────────────────────────────────────────────────────
      setCurrentProject: (project) => set({ currentProject: project }),

      setProjects: (projects) => set({ projects }),

      updateCurrentProjectName: (name) =>
        set((state) => ({
          currentProject: state.currentProject
            ? { ...state.currentProject, project_name: name }
            : null,
          projects: state.projects.map((p) =>
            p.id === state.currentProject?.id
              ? { ...p, project_name: name }
              : p
          ),
        })),

      addToRecent: (projectId) =>
        set((state) => {
          const filtered = state.recentProjectIds.filter(
            (id) => id !== projectId
          );
          return {
            recentProjectIds: [projectId, ...filtered].slice(0, 10),
          };
        }),

      removeProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          recentProjectIds: state.recentProjectIds.filter(
            (id) => id !== projectId
          ),
          currentProject:
            state.currentProject?.id === projectId
              ? null
              : state.currentProject,
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "erd-project-store",
      partialize: (state) => ({
        recentProjectIds: state.recentProjectIds,
      }),
    }
  )
);