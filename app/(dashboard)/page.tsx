"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Clock, Search, RefreshCw } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { useProjectStore } from "../../store";
import { ProjectGrid } from "../../components/dashboard/ProjectGrid";
import { NewProjectModal } from "../../components/dashboard/NewProjectModal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../lib/utils/cn";
import { projectToSummary } from "../../lib/utils/diagramHelpers";
import type { ProjectSummary } from "../../types/project";

// ── Loading skeleton ──────────────────────────────────────────────────────────
function ProjectSkeleton() {
  return (
    <div
      className="h-[200px] rounded-2xl bg-dark-800 border border-dark-700
                    animate-pulse"
    />
  );
}

export default function DashboardPage() {
  const supabase = createClient();
  const { recentProjectIds } = useProjectStore();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "recent">("all");

  // ── Fetch projects ──────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, project_name, is_public, share_id, created_at, updated_at, diagram",
        )
        .order("updated_at", { ascending: false });

      if (error) throw error;

      setProjects(
        (data ?? []).map((p) =>
          projectToSummary({
            ...p,
            diagram: p.diagram as Parameters<
              typeof projectToSummary
            >[0]["diagram"],
          }),
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleDeleted = (id: string) =>
    setProjects((prev) => prev.filter((p) => p.id !== id));

  const handleRenamed = (id: string, name: string) =>
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, project_name: name } : p)),
    );

  // ── Filtered lists ──────────────────────────────────────────────────────────
  const q = searchQuery.toLowerCase();

  const allFiltered = projects.filter((p) =>
    p.project_name.toLowerCase().includes(q),
  );

  const recentFiltered = projects
    .filter(
      (p) =>
        recentProjectIds.includes(p.id) &&
        p.project_name.toLowerCase().includes(q),
    )
    .sort(
      (a, b) => recentProjectIds.indexOf(a.id) - recentProjectIds.indexOf(b.id),
    );

  const displayed = activeTab === "recent" ? recentFiltered : allFiltered;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="flex flex-col gap-4 mb-8">
        <div
          className="flex flex-col sm:flex-row sm:items-center
                  justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl font-bold text-dark-50">My Projects</h1>
            <p className="text-sm text-dark-500 mt-1">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <Input
                placeholder="Search projects…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button
              variant="ghost"
              size="md"
              onClick={fetchProjects}
              className="w-9 h-9 p-0 shrink-0"
            >
              <RefreshCw
                className={cn("w-4 h-4", isLoading && "animate-spin")}
              />
            </Button>
            <Button
              onClick={() => setIsNewModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="shrink-0"
            >
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-dark-800">
        {[
          { id: "all", label: "All Projects", count: allFiltered.length },
          {
            id: "recent",
            label: "Recent",
            icon: <Clock className="w-3.5 h-3.5" />,
            count: recentFiltered.length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "all" | "recent")}
            className={cn(
              `flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
               border-b-2 -mb-px transition-all duration-200`,
              activeTab === tab.id
                ? "border-brand-500 text-brand-400"
                : "border-transparent text-dark-500 hover:text-dark-300",
            )}
          >
            {tab.icon}
            {tab.label}
            <span
              className={cn(
                "ml-1 px-1.5 py-0.5 rounded text-xs",
                activeTab === tab.id
                  ? "bg-brand-600/20 text-brand-400"
                  : "bg-dark-800 text-dark-500",
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                        xl:grid-cols-4 gap-4"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <ProjectSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="animate-fade-in">
          {searchQuery && displayed.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center
                            py-24 gap-4"
            >
              <div className="text-5xl">🔍</div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-dark-200">
                  No results for &quot;{searchQuery}&quot;
                </h3>
                <p className="text-sm text-dark-500 mt-1">
                  Try a different search term
                </p>
              </div>
              <Button variant="ghost" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            </div>
          ) : activeTab === "recent" && recentFiltered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center
                            py-24 gap-4"
            >
              <div className="text-5xl">🕐</div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-dark-200">
                  No recent projects
                </h3>
                <p className="text-sm text-dark-500 mt-1">
                  Open a project to see it here
                </p>
              </div>
            </div>
          ) : (
            <ProjectGrid
              projects={displayed}
              onNewProject={() => setIsNewModalOpen(true)}
              onDeleted={handleDeleted}
              onRenamed={handleRenamed}
            />
          )}
        </div>
      )}

      {/* New project modal */}
      <NewProjectModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />
    </div>
  );
}
