"use client";

import {
  Plus,
  Undo2,
  Redo2,
  Search,
  Code2,
  Download,
  Share2,
  Keyboard,
  Trash2,
  Copy,
  Clipboard,
  Table2,
} from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useDiagramStore, useUIStore, useHistoryStore } from "../../store";
import { ToolbarButton } from "./ToolbarButton";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import { cn } from "../../lib/utils/cn";

interface FloatingToolbarProps {
  onAddTable: () => void;
  onSave: () => void;
}

export function FloatingToolbar({ onAddTable, onSave }: FloatingToolbarProps) {
  const {
    selectedNodeIds,
    selectedEdgeIds,
    copySelected,
    pasteNodes,
    deleteSelected,
    copiedNodes,
  } = useDiagramStore();

  const {
    toggleSQLPanel,
    isSQLPanelOpen,
    setSearchOpen,
    isSearchOpen,
    openModal,
  } = useUIStore();

  const { undo, redo, canUndo, canRedo } = useHistoryStore();

  const hasSelection = selectedNodeIds.length > 0 || selectedEdgeIds.length > 0;
  const hasCopied = !!copiedNodes?.length;

  // ── Toolbar sections ─────────────────────────────────────────────────────
  const tableActions = [
    {
      icon: <Plus className="w-4 h-4" />,
      label: "Add table",
      shortcut: "Ctrl+N",
      onClick: onAddTable,
    },
  ];

  const editActions = [
    {
      icon: <Undo2 className="w-4 h-4" />,
      label: "Undo",
      shortcut: "Ctrl+Z",
      onClick: undo,
      disabled: !canUndo,
    },
    {
      icon: <Redo2 className="w-4 h-4" />,
      label: "Redo",
      shortcut: "Ctrl+Shift+Z",
      onClick: redo,
      disabled: !canRedo,
    },
  ];

  const selectionActions = [
    {
      icon: <Copy className="w-4 h-4" />,
      label: "Copy selected",
      shortcut: "Ctrl+C",
      onClick: copySelected,
      disabled: !hasSelection,
    },
    {
      icon: <Clipboard className="w-4 h-4" />,
      label: "Paste",
      shortcut: "Ctrl+V",
      onClick: pasteNodes,
      disabled: !hasCopied,
    },
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: "Delete selected",
      shortcut: "Delete",
      onClick: deleteSelected,
      disabled: !hasSelection,
      variant: "danger" as const,
    },
  ];

  const viewActions = [
    {
      icon: <Search className="w-4 h-4" />,
      label: "Search tables",
      shortcut: "Ctrl+F",
      onClick: () => setSearchOpen(true),
      isActive: isSearchOpen,
    },
    {
      icon: <Code2 className="w-4 h-4" />,
      label: "SQL Preview",
      shortcut: "Ctrl+`",
      onClick: toggleSQLPanel,
      isActive: isSQLPanelOpen,
    },
  ];

  const projectActions = [
    {
      icon: <Download className="w-4 h-4" />,
      label: "Export diagram",
      onClick: () => openModal("export"),
    },
    {
      icon: <Share2 className="w-4 h-4" />,
      label: "Share diagram",
      onClick: () => openModal("share"),
    },
    {
      icon: <Keyboard className="w-4 h-4" />,
      label: "Keyboard shortcuts",
      onClick: () => openModal("shortcuts"),
    },
  ];

  const Divider = () => (
    <div className="w-px h-6 bg-dark-700 mx-0.5 shrink-0" />
  );

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20
             flex items-center gap-1 px-2 py-1.5
             bg-dark-800/95 backdrop-blur-md border border-dark-700
             rounded-2xl shadow-dark-lg animate-slide-up
             max-w-[calc(100vw-2rem)] overflow-x-auto no-scrollbar"
    >
      {/* Table actions */}
      {tableActions.map((action) => (
        <ToolbarButton key={action.label} {...action} />
      ))}

      <Divider />

      {/* Edit actions */}
      {editActions.map((action) => (
        <ToolbarButton key={action.label} {...action} />
      ))}

      <Divider />

      {/* Selection actions */}
      {selectionActions.map((action) => (
        <ToolbarButton key={action.label} {...action} />
      ))}

      <Divider />

      {/* View actions */}
      {viewActions.map((action) => (
        <ToolbarButton key={action.label} {...action} />
      ))}

      <Divider />

      {/* Project actions */}
      {projectActions.map((action) => (
        <ToolbarButton key={action.label} {...action} />
      ))}

      <Divider />

      {/* Save status */}
      <div className="px-1">
        <SaveStatusIndicator onSave={onSave} />
      </div>
    </div>
  );
}
