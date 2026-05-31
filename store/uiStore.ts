"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PanelType =
  | "tableProperties"
  | "columnProperties"
  | "sqlPreview"
  | "relationship"
  | null;

export type ModalType =
  | "export"
  | "share"
  | "template"
  | "confirm"
  | "newProject"
  | "shortcuts"
  | null;

export type Theme = "dark" | "light";

interface UIStore {
  // Theme
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;

  // Panels
  activePanel: PanelType;
  activePanelNodeId: string | null;
  activePanelColumnId: string | null;
  openPanel: (panel: PanelType, nodeId?: string, columnId?: string) => void;
  closePanel: () => void;

  // Modals
  activeModal: ModalType;
  modalData: Record<string, unknown>;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Toolbar
  isSearchOpen: boolean;
  searchQuery: string;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;

  // SQL Preview
  isSQLPanelOpen: boolean;
  toggleSQLPanel: () => void;

  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  // Auto save indicator
  saveStatus: "idle" | "saving" | "saved" | "error";
  setSaveStatus: (status: UIStore["saveStatus"]) => void;

  // Confirm dialog
  confirmAction: (() => void) | null;
  confirmMessage: string;
  setConfirm: (message: string, action: () => void) => void;
  clearConfirm: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // ── Theme ────────────────────────────────────────────────────────────
      theme: "dark",
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      setTheme: (theme) => set({ theme }),

      // ── Panels ───────────────────────────────────────────────────────────
      activePanel: null,
      activePanelNodeId: null,
      activePanelColumnId: null,
      openPanel: (panel, nodeId, columnId) =>
        set({
          activePanel: panel,
          activePanelNodeId: nodeId ?? null,
          activePanelColumnId: columnId ?? null,
        }),
      closePanel: () =>
        set({
          activePanel: null,
          activePanelNodeId: null,
          activePanelColumnId: null,
        }),

      // ── Modals ───────────────────────────────────────────────────────────
      activeModal: null,
      modalData: {},
      openModal: (modal, data = {}) =>
        set({ activeModal: modal, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: {} }),

      // ── Toolbar ──────────────────────────────────────────────────────────
      isSearchOpen: false,
      searchQuery: "",
      setSearchOpen: (open) =>
        set({ isSearchOpen: open, searchQuery: open ? "" : "" }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      // ── SQL Preview ──────────────────────────────────────────────────────
      isSQLPanelOpen: false,
      toggleSQLPanel: () =>
        set((state) => ({ isSQLPanelOpen: !state.isSQLPanelOpen })),

      // ── Sidebar ──────────────────────────────────────────────────────────
      isSidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      // ── Save status ──────────────────────────────────────────────────────
      saveStatus: "idle",
      setSaveStatus: (saveStatus) => set({ saveStatus }),

      // ── Confirm ──────────────────────────────────────────────────────────
      confirmAction: null,
      confirmMessage: "",
      setConfirm: (message, action) =>
        set({ confirmMessage: message, confirmAction: action,
              activeModal: "confirm" }),
      clearConfirm: () =>
        set({ confirmAction: null, confirmMessage: "",
              activeModal: null }),
    }),
    {
      name: "erd-ui-store",
      partialize: (state) => ({
        theme: state.theme,
        isSidebarOpen: state.isSidebarOpen,
        isSQLPanelOpen: state.isSQLPanelOpen,
      }),
    }
  )
);