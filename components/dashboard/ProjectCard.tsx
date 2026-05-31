"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal, Pencil, Trash2, Globe, Lock,
  ArrowRight, Table2, GitBranch,
} from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { useProjectStore } from "../../store";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils/cn";
import { formatRelativeTime } from "../../lib/utils/diagramHelpers";
import type { ProjectSummary } from "../../types/project";

interface ProjectCardProps {
  project: ProjectSummary;
  onDeleted: (id: string) => void;
  onRenamed: (id: string, name: string) => void;
}

export function ProjectCard({
  project,
  onDeleted,
  onRenamed,
}: ProjectCardProps) {
  const router   = useRouter();
  const supabase = createClient();
  const { addToRecent } = useProjectStore();

  const [menuOpen, setMenuOpen]       = useState(false);
  const [isRenaming, setIsRenaming]   = useState(false);
  const [newName, setNewName]         = useState(project.project_name);
  const [isDeleting, setIsDeleting]   = useState(false);
  const menuRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus rename input
  useEffect(() => {
    if (isRenaming) inputRef.current?.select();
  }, [isRenaming]);

  const handleOpen = () => {
    addToRecent(project.id);
    router.push(`/editor/${project.id}`);
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === project.project_name) {
      setIsRenaming(false);
      setNewName(project.project_name);
      return;
    }
    const { error } = await supabase
      .from("projects")
      .update({ project_name: newName.trim() })
      .eq("id", project.id);
    if (!error) onRenamed(project.id, newName.trim());
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);
    if (!error) onDeleted(project.id);
    setIsDeleting(false);
  };

  return (
    <div
      className={cn(
        `group relative bg-dark-800 border border-dark-700 rounded-2xl
         overflow-hidden transition-all duration-300
         hover:border-dark-600 hover:shadow-dark-lg hover:-translate-y-0.5`,
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
      {/* Preview area */}
      <div
        className="h-32 bg-gradient-to-br from-dark-900 to-dark-800
                   relative overflow-hidden cursor-pointer"
        onClick={handleOpen}
      >
        {/* Grid dots */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(#6270f1 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Stats overlay */}
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-1
                           rounded-md bg-dark-900/80 border border-dark-700
                           text-xs text-dark-300">
            <Table2 className="w-3 h-3 text-brand-400" />
            {project.nodeCount} table{project.nodeCount !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1
                           rounded-md bg-dark-900/80 border border-dark-700
                           text-xs text-dark-300">
            <GitBranch className="w-3 h-3 text-emerald-400" />
            {project.edgeCount} rel{project.edgeCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Hover open button */}
        <div className="absolute inset-0 flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-opacity
                        bg-dark-900/50">
          <span className="inline-flex items-center gap-2 px-4 py-2
                           rounded-xl bg-brand-600 text-white text-sm
                           font-medium shadow-glow">
            Open <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          {/* Name */}
          <div className="flex-1 min-w-0">
            {isRenaming ? (
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") {
                    setIsRenaming(false);
                    setNewName(project.project_name);
                  }
                }}
                className="w-full bg-dark-900 border border-brand-600
                           text-dark-100 text-sm font-semibold rounded-lg
                           px-2 py-1 focus:outline-none focus:ring-2
                           focus:ring-brand-600/40"
              />
            ) : (
              <h3 className="text-sm font-semibold text-dark-100 truncate">
                {project.project_name}
              </h3>
            )}
            <p className="text-xs text-dark-500 mt-0.5 flex items-center gap-1.5">
              {project.is_public
                ? <Globe className="w-3 h-3 text-emerald-500" />
                : <Lock className="w-3 h-3" />
              }
              {formatRelativeTime(project.updated_at)}
            </p>
          </div>

          {/* Menu */}
          <div ref={menuRef} className="relative shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="w-7 h-7 p-0 opacity-0 group-hover:opacity-100
                         transition-opacity"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>

            {menuOpen && (
              <div className=" right-0 top-8 z-20 w-44 bg-dark-800
                              border border-dark-700 rounded-xl shadow-dark-lg
                              py-1 animate-slide-down">
                <button
                  onClick={() => { setIsRenaming(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2
                             text-sm text-dark-300 hover:text-dark-100
                             hover:bg-dark-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Rename
                </button>
                <button
                  onClick={() => { handleDelete(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2
                             text-sm text-red-400 hover:text-red-300
                             hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}