"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "../lib/supabase/client";
import { useDiagramStore, useUIStore, useProjectStore } from "../store";
import { toast } from "../components/ui/Toast";

const DEBOUNCE_MS = 2000; // save 2 s after last change

export function useAutoSave(projectId: string) {
  const supabase = createClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { nodes, edges, viewport, isDirty, markClean } = useDiagramStore();
  const { setSaveStatus } = useUIStore();
  const { setCurrentProject } = useProjectStore();

  const save = useCallback(async () => {
    try {
      setSaveStatus("saving");

      const diagram = { nodes, edges, viewport };

      const { data, error } = await supabase
        .from("projects")
        .update({
          diagram: diagram as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;

      markClean();
      setSaveStatus("saved");

      if (data) {
        const d = data as any;
        setCurrentProject(d);
      }

      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Auto-save failed:", err);
      setSaveStatus("error");
      toast.error(
        "Auto-save failed",
        "Your changes could not be saved. Check your connection.",
      );
    }
  }, [
    nodes,
    edges,
    viewport,
    projectId,
    supabase,
    markClean,
    setSaveStatus,
    setCurrentProject,
  ]);

  // Debounced auto-save whenever diagram changes
  useEffect(() => {
    if (!isDirty) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, save]);

  // Manual save (called by Ctrl+S)
  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await save();
  }, [save]);

  return { saveNow };
}
