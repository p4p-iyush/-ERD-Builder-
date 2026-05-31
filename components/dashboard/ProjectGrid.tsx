"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import { Button } from "../../components/ui/Button";
import type { ProjectSummary } from "../../types/project";

interface ProjectGridProps {
  projects: ProjectSummary[];
  onNewProject: () => void;
  onDeleted: (id: string) => void;
  onRenamed: (id: string, name: string) => void;
}

export function ProjectGrid({
  projects,
  onNewProject,
  onDeleted,
  onRenamed,
}: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div className="w-20 h-20 rounded-2xl bg-dark-800 border border-dark-700
                        flex items-center justify-center text-4xl">
          🗄️
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-dark-100">
            No projects yet
          </h3>
          <p className="text-sm text-dark-500 mt-1 max-w-xs">
            Create your first ERD diagram to visualize your database schema
          </p>
        </div>
        <Button
          onClick={onNewProject}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Project
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                    xl:grid-cols-4 gap-4">
      {/* New project card */}
      <button
        onClick={onNewProject}
        className="h-[200px] rounded-2xl border-2 border-dashed
                   border-dark-700 hover:border-brand-600/50
                   hover:bg-brand-600/5 flex flex-col items-center
                   justify-center gap-3 transition-all duration-300
                   group"
      >
        <div className="w-10 h-10 rounded-xl bg-dark-700
                        group-hover:bg-brand-600/20 border border-dark-600
                        group-hover:border-brand-500/40 flex items-center
                        justify-center transition-all duration-300">
          <Plus className="w-5 h-5 text-dark-400
                           group-hover:text-brand-400 transition-colors" />
        </div>
        <span className="text-sm font-medium text-dark-500
                         group-hover:text-brand-400 transition-colors">
          New Project
        </span>
      </button>

      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onDeleted={onDeleted}
          onRenamed={onRenamed}
        />
      ))}
    </div>
  );
}