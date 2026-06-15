"use client";
import { useEffect, useCallback, use, useState } from "react";
import { useRouter } from "next/navigation";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { createClient } from "../../../lib/supabase/client";
import {
  useDiagramStore,
  useUIStore,
  useProjectStore,
  useHistoryStore,
} from "../../../store";
import { ERDCanvas } from "../../../components/canvas/ERDCanvas";
import { FloatingToolbar } from "../../../components/toolbar/FloatingToolbar";
import { SearchPanel } from "../../../components/toolbar/SearchPanel";
import { EditorHeader } from "../../../components/layout/EditorHeader";
import { ShortcutsModal } from "../../../components/modals/ShortcutsModal";
import { ConfirmModal } from "../../../components/modals/ConfirmModal";
import { useAutoSave } from "../../../hooks/useAutoSave";
import { useKeyboardShortcuts } from "../../../hooks/useKeyboardShortcuts";
import { cn } from "../../../lib/utils/cn";
import type { DiagramData } from "../../../types/diagram";
import type { Project } from "../../../types/project";

import { SQLPreviewPanel } from "../../../components/panels/SQLPreviewPanel";
import { ExportModal } from "../../../components/modals/ExportModal";

// Add these imports
import { TablePropertiesPanel } from "../../../components/panels/TablePropertiesPanel";
import { ColumnPropertiesPanel } from "../../../components/panels/ColumnPropertiesPanel";
import { RelationshipPanel } from "../../../components/panels/RelationshipPanel";

// Add this line alongside the other panel imports
import { DBImportPanel } from "../../../components/panels/DBImportPanel";

import { ShareModal } from "../../../components/modals/ShareModal";
import { QueryVisualizerPanel } from "../../../components/panels/QueryVisualizerPanel";

// ── Inner editor — must be inside ReactFlowProvider ───────────────────────
function EditorInner({
  projectId,
  initialProject,
}: {
  projectId: string;
  initialProject: Project;
}) {
  const router = useRouter();
  const supabase = createClient();

  const { setDiagram, addTable } = useDiagramStore();
  const { setCurrentProject, addToRecent } = useProjectStore();
  const { clearHistory } = useHistoryStore();
  const { isSQLPanelOpen } = useUIStore();
  const [isDBImportOpen, setIsDBImportOpen] = useState(false);
  const [isQueryVizOpen, setIsQueryVizOpen] = useState(false);
  // Load diagram into stores on mount
  useEffect(() => {
    setCurrentProject(initialProject);
    addToRecent(initialProject.id);
    setDiagram(initialProject.diagram as DiagramData);
    clearHistory();
  }, [
    initialProject,
    setCurrentProject,
    addToRecent,
    setDiagram,
    clearHistory,
  ]);

  // Auto-save
  const { saveNow } = useAutoSave(projectId);

  // Add table helper — center of viewport
  const handleAddTable = useCallback(() => {
    addTable({ x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 });
  }, [addTable]);

  // Keyboard shortcuts
  useKeyboardShortcuts({ onSave: saveNow, onAddTable: handleAddTable });

  return (
    <div className="flex flex-col h-screen bg-dark-950 overflow-hidden">
      {/* Editor header */}
      <EditorHeader />
      {/* Main area */}
  <div className="flex flex-1 overflow-hidden relative">

  {/* DB Import panel — left side */}
  {isDBImportOpen && (
    <div
      className="w-[360px] shrink-0 border-r border-dark-800
                 bg-dark-900 overflow-hidden flex flex-col
                 animate-slide-up"
    >
      <DBImportPanel onClose={() => setIsDBImportOpen(false)} />
    </div>
  )}

  {/* Query Visualizer panel — left side (replaces DB Import if both somehow open) */}
  {isQueryVizOpen && !isDBImportOpen && (
    <div
      className="w-[360px] shrink-0 border-r border-dark-800
                 bg-dark-900 overflow-hidden flex flex-col
                 animate-slide-up"
    >
      <QueryVisualizerPanel onClose={() => setIsQueryVizOpen(false)} />
    </div>
  )}

  {/* Canvas */}
  <div className="flex-1 relative">
    <ERDCanvas />
    <SearchPanel />

    {/* Properties panels — float over canvas */}
    <TablePropertiesPanel />
    <ColumnPropertiesPanel />
    <RelationshipPanel />

    <FloatingToolbar
      onAddTable={handleAddTable}
      onSave={saveNow}
      onToggleDBImport={() => {
        setIsDBImportOpen((p) => !p);
        setIsQueryVizOpen(false);
      }}
      isDBImportOpen={isDBImportOpen}
      onToggleQueryViz={() => {
        setIsQueryVizOpen((p) => !p);
        setIsDBImportOpen(false);
      }}
      isQueryVizOpen={isQueryVizOpen}
    />
  </div>

  {/* SQL Preview panel — right side */}
  {isSQLPanelOpen && (
    <div
      className="w-[400px] shrink-0 border-l border-dark-800
                 bg-dark-900 overflow-hidden flex flex-col
                 animate-slide-up"
    >
      <SQLPreviewPanel />
    </div>
  )}
</div>
      {/* Modals */}
      <ShortcutsModal />
      <ConfirmModal />
      <ExportModal />
      <ShareModal />
    </div>
  );
}

// ── Data-fetching wrapper ─────────────────────────────────────────────────
export default function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const { currentProject, setCurrentProject, setLoading, isLoading } =
    useProjectStore();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error || !data) {
        router.push("/");
        return;
      }

      setCurrentProject({
        ...data,
        diagram: data.diagram as DiagramData,
      });
      setLoading(false);
    }
    load();
  }, [projectId, supabase, router, setCurrentProject, setLoading]);

  if (isLoading || !currentProject) {
    return (
      <div
        className="h-screen bg-dark-950 flex flex-col items-center
                      justify-center gap-4"
      >
        <div
          className="w-10 h-10 border-2 border-brand-500
                        border-t-transparent rounded-full animate-spin"
        />
        <p className="text-sm text-dark-500">Loading project…</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <EditorInner projectId={projectId} initialProject={currentProject} />
    </ReactFlowProvider>
  );
}
