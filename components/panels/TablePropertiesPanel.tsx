"use client";

import { useState, useEffect } from "react";
import {
  X, Table2, Plus, Trash2, GripVertical,
  ChevronDown,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useDiagramStore, useUIStore, useHistoryStore } from "../../store";
import { ColorPicker } from "./ColorPicker";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ColumnBadge } from "../nodes/ColumnBadge";
import { cn } from "../../lib/utils/cn";
import { getDataTypeLabel, getDataTypeColor } from "../../lib/constants/dataTypes";
import type { Column } from "../../types/column";

// ── Sortable column item ───────────────────────────────────────────────────
function SortableColumnItem({
  column,
  nodeId,
  onEdit,
  onDelete,
}: {
  column:   Column;
  nodeId:   string;
  onEdit:   (col: Column) => void;
  onDelete: (colId: string) => void;
}) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        `flex items-center gap-2 px-2 py-2 rounded-lg border
         transition-colors group/col`,
        isDragging
          ? "border-brand-500/50 bg-brand-600/10"
          : "border-dark-700 hover:border-dark-600 bg-dark-900/50"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-dark-600 hover:text-dark-400 cursor-grab
                   active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {/* Badges */}
      <div className="flex gap-1 shrink-0">
        {column.isPrimaryKey  && <ColumnBadge type="PK" />}
        {column.isForeignKey  && <ColumnBadge type="FK" />}
        {column.isUnique && !column.isPrimaryKey && <ColumnBadge type="UQ" />}
      </div>

      {/* Name */}
      <span className="flex-1 text-xs font-medium text-dark-200 truncate">
        {column.name}
      </span>

      {/* Type */}
      <span
        className="text-[10px] font-mono shrink-0"
        style={{ color: getDataTypeColor(column.dataType) }}
      >
        {getDataTypeLabel(column.dataType)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0
                      group-hover/col:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(column)}
          className="w-5 h-5 flex items-center justify-center rounded
                     text-dark-400 hover:text-brand-400 hover:bg-brand-600/10
                     transition-colors"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(column.id)}
          disabled={column.isPrimaryKey}
          className="w-5 h-5 flex items-center justify-center rounded
                     text-dark-400 hover:text-red-400 hover:bg-red-500/10
                     transition-colors disabled:opacity-30
                     disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────
export function TablePropertiesPanel() {
  const {
    nodes,
    updateTableName,
    updateTableColor,
    addColumn,
    deleteColumn,
    reorderColumns,
  } = useDiagramStore();
  const { activePanel, activePanelNodeId, closePanel, openPanel } = useUIStore();
  const { pushSnapshot } = useHistoryStore();

  const isOpen = activePanel === "tableProperties";
  const node   = nodes.find((n) => n.id === activePanelNodeId);

  const [localName, setLocalName] = useState("");

  useEffect(() => {
    if (node) setLocalName(node.data.tableName);
  }, [node?.data.tableName]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor,  { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isOpen || !node) return null;

  const columns = [...node.data.columns].sort((a, b) => a.order - b.order);

  const commitName = () => {
    const trimmed = localName.trim();
    if (trimmed && trimmed !== node.data.tableName) {
      pushSnapshot();
      updateTableName(node.id, trimmed);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx    = columns.findIndex((c) => c.id === active.id);
    const newIdx    = columns.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(columns, oldIdx, newIdx).map((c, i) => ({
      ...c,
      order: i,
    }));

    pushSnapshot();
    reorderColumns(node.id, reordered);
  };

  const handleAddColumn = () => {
    pushSnapshot();
    addColumn(node.id);
  };

  const handleDeleteColumn = (colId: string) => {
    pushSnapshot();
    deleteColumn(node.id, colId);
  };

  const handleEditColumn = (col: Column) => {
    openPanel("columnProperties", node.id, col.id);
  };

  return (
    <div
      className="absolute right-4 top-16 bottom-20 z-20
                 w-72 flex flex-col animate-slide-up"
    >
      <div
        className="flex flex-col h-full bg-dark-800/95 backdrop-blur-md
                   border border-dark-700 rounded-2xl shadow-dark-lg
                   overflow-hidden"
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-4 py-3
                     border-b border-dark-700 shrink-0"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                backgroundColor: `${node.data.color ?? "#6270f1"}20`,
              }}
            >
              <Table2
                className="w-3.5 h-3.5"
                style={{ color: node.data.color ?? "#6270f1" }}
              />
            </div>
            <span className="text-sm font-semibold text-dark-100">
              Table Properties
            </span>
          </div>
          <button
            onClick={closePanel}
            className="w-6 h-6 flex items-center justify-center rounded-md
                       text-dark-400 hover:text-dark-200 hover:bg-dark-700
                       transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Table name */}
          <Input
            label="Table name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === "Enter" && commitName()}
            placeholder="table_name"
          />

          {/* Color */}
          <div>
            <label className="text-xs font-medium text-dark-400 uppercase
                              tracking-wider mb-2 block">
              Color
            </label>
            <ColorPicker
              value={node.data.color ?? "#6270f1"}
              onChange={(color) => {
                pushSnapshot();
                updateTableColor(node.id, color);
              }}
            />
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-2 p-3 rounded-xl
                       bg-dark-900/60 border border-dark-700"
          >
            {[
              { label: "Columns", value: columns.length },
              {
                label: "PKs",
                value: columns.filter((c) => c.isPrimaryKey).length,
              },
              {
                label: "FKs",
                value: columns.filter((c) => c.isForeignKey).length,
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-lg font-bold text-dark-100">
                  {stat.value}
                </div>
                <div className="text-[10px] text-dark-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Columns section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-dark-400 uppercase
                                tracking-wider">
                Columns
              </label>
              <button
                onClick={handleAddColumn}
                className="flex items-center gap-1 text-xs text-brand-400
                           hover:text-brand-300 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columns.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {columns.length === 0 ? (
                    <div
                      className="text-xs text-dark-500 text-center py-4
                                 border border-dashed border-dark-700
                                 rounded-lg"
                    >
                      No columns yet
                    </div>
                  ) : (
                    columns.map((col) => (
                      <SortableColumnItem
                        key={col.id}
                        column={col}
                        nodeId={node.id}
                        onEdit={handleEditColumn}
                        onDelete={handleDeleteColumn}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-dark-700 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={closePanel}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}