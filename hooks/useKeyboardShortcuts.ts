"use client";

import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useDiagramStore, useUIStore, useHistoryStore } from "../store";

interface UseKeyboardShortcutsOptions {
  onSave: () => void;
  onAddTable: () => void;
}

export function useKeyboardShortcuts({
  onSave,
  onAddTable,
}: UseKeyboardShortcutsOptions) {
  const {
    copySelected, pasteNodes, deleteSelected,
    selectAll, clearSelection,
  } = useDiagramStore();

  const {
    toggleSQLPanel, setSearchOpen,
    openModal, closeModal, activeModal,
  } = useUIStore();

  const { undo, redo, canUndo, canRedo } = useHistoryStore();
  const { fitView }                      = useReactFlow();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const tag  = (e.target as HTMLElement).tagName;

      // Don't intercept when typing in inputs
      const isTyping =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
        (e.target as HTMLElement).isContentEditable;

      // Allow Escape even while typing
      if (e.key === "Escape") {
        clearSelection();
        closeModal();
        setSearchOpen(false);
        return;
      }

      if (isTyping) return;

      // ── Ctrl / Cmd combos ──────────────────────────────────────────────
      if (ctrl) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault();
            onSave();
            break;
          case "z":
            e.preventDefault();
            if (e.shiftKey) { if (canRedo) redo(); }
            else            { if (canUndo) undo(); }
            break;
          case "y":
            e.preventDefault();
            if (canRedo) redo();
            break;
          case "c":
            e.preventDefault();
            copySelected();
            break;
          case "v":
            e.preventDefault();
            pasteNodes();
            break;
          case "d":
            e.preventDefault();
            // duplicate is handled per-node; here we paste as duplicate
            pasteNodes();
            break;
          case "a":
            e.preventDefault();
            selectAll();
            break;
          case "n":
            e.preventDefault();
            onAddTable();
            break;
          case "f":
            e.preventDefault();
            setSearchOpen(true);
            break;
          case "`":
            e.preventDefault();
            toggleSQLPanel();
            break;
          case "=":
          case "+":
            // zoom handled by React Flow natively
            break;
          case "-":
            // zoom handled by React Flow natively
            break;
          default:
            // Ctrl+Shift+F — fit view
            if (e.shiftKey && e.key === "F") {
              e.preventDefault();
              fitView({ padding: 0.1, duration: 600 });
            }
            // Ctrl+/ — shortcuts modal
            if (e.key === "/") {
              e.preventDefault();
              if (activeModal === "shortcuts") closeModal();
              else openModal("shortcuts");
            }
            break;
        }
        return;
      }

      // ── Non-ctrl keys ──────────────────────────────────────────────────
      switch (e.key) {
        case "Delete":
        case "Backspace":
          deleteSelected();
          break;
        case "F2":
          e.preventDefault();
          // trigger rename on focused node — handled inside TableHeader
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    onSave, onAddTable,
    copySelected, pasteNodes, deleteSelected,
    selectAll, clearSelection,
    toggleSQLPanel, setSearchOpen,
    openModal, closeModal, activeModal,
    undo, redo, canUndo, canRedo,
    fitView,
  ]);
}