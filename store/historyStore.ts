"use client";

import { create } from "zustand";
import type { DiagramSnapshot } from "../types/diagram";
import { useDiagramStore } from "./diagramStore";

const MAX_HISTORY = 50;

interface HistoryStore {
  past: DiagramSnapshot[];
  future: DiagramSnapshot[];
  canUndo: boolean;
  canRedo: boolean;

  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  pushSnapshot: () => {
    const { nodes, edges } = useDiagramStore.getState();
    const snapshot: DiagramSnapshot = {
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
      timestamp: Date.now(),
    };
    set((state) => {
      const newPast = [...state.past, snapshot].slice(-MAX_HISTORY);
      return {
        past: newPast,
        future: [],
        canUndo: newPast.length > 0,
        canRedo: false,
      };
    });
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;

    const { nodes, edges } = useDiagramStore.getState();
    const currentSnapshot: DiagramSnapshot = {
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
      timestamp: Date.now(),
    };

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    useDiagramStore.setState({
      nodes: previous.nodes,
      edges: previous.edges,
      isDirty: true,
    });

    set({
      past: newPast,
      future: [currentSnapshot, ...future].slice(0, MAX_HISTORY),
      canUndo: newPast.length > 0,
      canRedo: true,
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;

    const { nodes, edges } = useDiagramStore.getState();
    const currentSnapshot: DiagramSnapshot = {
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
      timestamp: Date.now(),
    };

    const next = future[0];
    const newFuture = future.slice(1);

    useDiagramStore.setState({
      nodes: next.nodes,
      edges: next.edges,
      isDirty: true,
    });

    set({
      past: [...past, currentSnapshot].slice(-MAX_HISTORY),
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
    });
  },

  clearHistory: () =>
    set({ past: [], future: [], canUndo: false, canRedo: false }),
}));