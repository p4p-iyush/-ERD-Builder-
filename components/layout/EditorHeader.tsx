"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Database, ChevronLeft, Check, Globe, Lock,
} from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { useProjectStore, useUIStore } from "../../store";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "../../components/ui/Button";
import { Tooltip } from "../../components/ui/Tooltip";
import { cn } from "../../lib/utils/cn";

export function EditorHeader() {
  const router   = useRouter();
  const supabase = createClient();

  const { currentProject, updateCurrentProjectName } = useProjectStore();
  const { openModal } = useUIStore();

  const [isEditing, setIsEditing]   = useState(false);
  const [localName, setLocalName]   = useState(
    currentProject?.project_name ?? "Untitled Project"
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if project loads after mount
  useEffect(() => {
    if (currentProject?.project_name) {
      setLocalName(currentProject.project_name);
    }
  }, [currentProject?.project_name]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitRename = async () => {
    const trimmed = localName.trim();
    if (!trimmed) {
      setLocalName(currentProject?.project_name ?? "Untitled Project");
      setIsEditing(false);
      return;
    }
    if (trimmed !== currentProject?.project_name && currentProject?.id) {
      await supabase
        .from("projects")
        .update({ project_name: trimmed })
        .eq("id", currentProject.id);
      updateCurrentProjectName(trimmed);
    }
    setIsEditing(false);
  };

  const isPublic = currentProject?.is_public ?? false;

  return (
    <header
      className="h-12 bg-dark-900/90 backdrop-blur-md border-b
                 border-dark-800 flex items-center px-4 gap-3
                 sticky top-0 z-30 shrink-0"
    >
      {/* Back button */}
      <Tooltip content="Back to dashboard" side="bottom">
        <Link
          href="/"
          className="w-8 h-8 flex items-center justify-center rounded-lg
                     text-dark-400 hover:text-dark-100 hover:bg-dark-700
                     transition-all duration-150"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </Tooltip>

      {/* Logo */}
      <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center
                      justify-center shadow-glow-sm shrink-0">
        <Database className="w-3.5 h-3.5 text-white" />
      </div>

      <div className="w-px h-4 bg-dark-700 shrink-0" />

      {/* Project name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter")  commitRename();
                if (e.key === "Escape") {
                  setLocalName(currentProject?.project_name ?? "");
                  setIsEditing(false);
                }
              }}
              className="bg-dark-800 border border-brand-600/50 text-dark-100
                         text-sm font-semibold rounded-lg px-2.5 py-1
                         focus:outline-none focus:ring-2
                         focus:ring-brand-600/40 w-64"
            />
            <button
              onClick={commitRename}
              className="w-7 h-7 flex items-center justify-center rounded-md
                         bg-brand-600/20 text-brand-400 hover:bg-brand-600/30
                         transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 group"
          >
            <span
              className="text-sm font-semibold text-dark-100 truncate
                         max-w-[200px] group-hover:text-brand-300
                         transition-colors"
            >
              {currentProject?.project_name ?? "Untitled Project"}
            </span>
            <span
              className="text-[10px] text-dark-600 opacity-0
                         group-hover:opacity-100 transition-opacity"
            >
              click to rename
            </span>
          </button>
        )}

        {/* Public/private badge */}
        <Tooltip
          content={isPublic ? "Public — anyone with link can view" : "Private"}
          side="bottom"
        >
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded",
              "text-[10px] font-medium border",
              isPublic
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-dark-800 text-dark-600 border-dark-700"
            )}
          >
            {isPublic
              ? <Globe className="w-2.5 h-2.5" />
              : <Lock  className="w-2.5 h-2.5" />
            }
            {isPublic ? "Public" : "Private"}
          </span>
        </Tooltip>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openModal("share")}
          className="hidden sm:flex gap-1.5 text-xs h-8"
        >
          <Globe className="w-3.5 h-3.5" />
          Share
        </Button>

        <ThemeToggle />
      </div>
    </header>
  );
}