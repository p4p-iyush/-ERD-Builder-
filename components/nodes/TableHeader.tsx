    "use client";

import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Plus, Trash2, Copy, MoreHorizontal, GripVertical,
} from "lucide-react";
import { useDiagramStore, useUIStore } from "../../store";
import { useHistoryStore } from "../../store";
import { cn } from "../../lib/utils/cn";

interface TableHeaderProps {
  nodeId: string;
  tableName: string;
  color: string;
  columnCount: number;
  isHighlighted?: boolean;
  isFaded?: boolean;
}

export const TableHeader = memo(function TableHeader({
  nodeId,
  tableName,
  color,
  columnCount,
  isHighlighted,
  isFaded,
}: TableHeaderProps) {
  const { updateTableName, deleteTable, duplicateTable, addColumn } =
    useDiagramStore();
  const { pushSnapshot } = useHistoryStore();
  const { openPanel } = useUIStore();

  const [isEditing, setIsEditing]   = useState(false);
  const [localName, setLocalName]   = useState(tableName);
  const [menuOpen, setMenuOpen]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef  = useRef<HTMLDivElement>(null);

  // Sync external name changes
  useEffect(() => { setLocalName(tableName); }, [tableName]);

  // Focus input when editing
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

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

  const commitRename = () => {
    const trimmed = localName.trim();
    if (trimmed && trimmed !== tableName) {
      pushSnapshot();
      updateTableName(nodeId, trimmed);
    } else {
      setLocalName(tableName);
    }
    setIsEditing(false);
  };

  const handleAddColumn = (e: React.MouseEvent) => {
    e.stopPropagation();
    pushSnapshot();
    addColumn(nodeId);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    pushSnapshot();
    deleteTable(nodeId);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    pushSnapshot();
    duplicateTable(nodeId);
  };

  return (
    <div
      className="relative flex items-center gap-2 px-3 py-2.5 rounded-t-xl
                 cursor-grab active:cursor-grabbing select-none"
      style={{ backgroundColor: `${color}20`, borderBottom: `1px solid ${color}40` }}
    >
      {/* Table-level source handle */}
      <Handle
        type="source"
        position={Position.Left}
        id={`${nodeId}-table-left`}
        className={cn(
          `!w-3 !h-3 !rounded-full !border-2 !left-[-6px]
           transition-all duration-150`,
          isHighlighted
            ? "!bg-brand-400 !border-brand-500 !opacity-100"
            : "!bg-dark-700 !border-dark-600 !opacity-0 hover:!opacity-100"
        )}
      />

      {/* Drag grip */}
      <GripVertical
        className="w-3.5 h-3.5 shrink-0 opacity-30"
        style={{ color }}
      />

      {/* Table name */}
      {isEditing ? (
        <input
          ref={inputRef}
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter")  commitRename();
            if (e.key === "Escape") {
              setLocalName(tableName);
              setIsEditing(false);
            }
          }}
          className="flex-1 bg-dark-900/80 text-dark-50 text-sm font-bold
                     rounded px-2 py-0.5 focus:outline-none focus:ring-1
                     focus:ring-brand-500 min-w-0"
          style={{ caretColor: color }}
        />
      ) : (
        <span
          className="flex-1 text-sm font-bold text-dark-50 truncate
                     cursor-text"
          onDoubleClick={() => setIsEditing(true)}
          style={{ textShadow: `0 0 20px ${color}60` }}
        >
          {tableName}
        </span>
      )}

      {/* Column count badge */}
      <span
        className="text-[10px] font-medium px-1.5 py-0.5 rounded
                   shrink-0 opacity-70"
        style={{
          color,
          backgroundColor: `${color}20`,
        }}
      >
        {columnCount}
      </span>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Add column */}
        <button
          onClick={handleAddColumn}
          className="w-6 h-6 rounded flex items-center justify-center
                     hover:bg-white/10 text-dark-400 hover:text-dark-100
                     transition-colors"
          title="Add column"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* More menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            className="w-6 h-6 rounded flex items-center justify-center
                       hover:bg-white/10 text-dark-400 hover:text-dark-100
                       transition-colors"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-7 z-50 w-44 bg-dark-800
                         border border-dark-700 rounded-xl shadow-dark-lg
                         py-1 animate-slide-down"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  openPanel("tableProperties", nodeId);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2
                           text-xs text-dark-300 hover:text-dark-100
                           hover:bg-dark-700 transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
                Properties
              </button>
              <button
                onClick={(e) => { handleDuplicate(e); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2
                           text-xs text-dark-300 hover:text-dark-100
                           hover:bg-dark-700 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <div className="my-1 border-t border-dark-700" />
              <button
                onClick={(e) => { handleDelete(e); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2
                           text-xs text-red-400 hover:text-red-300
                           hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete table
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table-level target handle */}
      <Handle
        type="target"
        position={Position.Right}
        id={`${nodeId}-table-right`}
        className={cn(
          `!w-3 !h-3 !rounded-full !border-2 !right-[-6px]
           transition-all duration-150`,
          isHighlighted
            ? "!bg-brand-400 !border-brand-500 !opacity-100"
            : "!bg-dark-700 !border-dark-600 !opacity-0 hover:!opacity-100"
        )}
      />
    </div>
  );
});