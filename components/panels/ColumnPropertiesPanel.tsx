"use client";

import { useState, useEffect } from "react";
import { X, Key, Link, Fingerprint, AlertCircle } from "lucide-react";
import { useDiagramStore, useUIStore, useHistoryStore } from "../../store";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { SelectDropdown } from "../../components/ui/Dropdown";
import { DATA_TYPE_OPTIONS } from "../../lib/constants/dataTypes";
import { cn } from "../../lib/utils/cn";
import type { Column, DataType } from "../../types/column";

// ── Toggle switch ──────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
  color = "brand",
  disabled,
}: {
  checked:     boolean;
  onChange:    (v: boolean) => void;
  label:       string;
  description?: string;
  icon:        React.ReactNode;
  color?:      "brand" | "amber" | "blue" | "purple" | "red";
  disabled?:   boolean;
}) {
  const colors = {
    brand:  { bg: "bg-brand-600",  ring: "ring-brand-500/30"  },
    amber:  { bg: "bg-amber-500",  ring: "ring-amber-500/30"  },
    blue:   { bg: "bg-blue-500",   ring: "ring-blue-500/30"   },
    purple: { bg: "bg-purple-500", ring: "ring-purple-500/30" },
    red:    { bg: "bg-red-500",    ring: "ring-red-500/30"    },
  };

  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        `flex items-center gap-3 w-full p-3 rounded-xl border
         transition-all duration-200 text-left`,
        checked
          ? `border-${color === "brand" ? "brand" : color}-500/30
             bg-${color === "brand" ? "brand" : color}-600/10`
          : "border-dark-700 hover:border-dark-600 bg-dark-900/40",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {/* Toggle track */}
      <div
        className={cn(
          `relative w-9 h-5 rounded-full transition-all duration-200
           shrink-0 ring-2`,
          checked
            ? `${colors[color].bg} ${colors[color].ring}`
            : "bg-dark-700 ring-transparent"
        )}
      >
        <div
          className={cn(
            `absolute top-0.5 w-4 h-4 rounded-full bg-white
             shadow transition-all duration-200`,
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </div>

      {/* Icon + label */}
      <div
        className={cn(
          "flex items-center gap-2 flex-1",
          checked ? "text-dark-100" : "text-dark-400"
        )}
      >
        <span className={cn(checked && `text-${color === "brand" ? "brand" : color}-400`)}>
          {icon}
        </span>
        <div>
          <div className="text-sm font-medium leading-tight">{label}</div>
          {description && (
            <div className="text-[10px] text-dark-500 mt-0.5">
              {description}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────
export function ColumnPropertiesPanel() {
  const { nodes, updateColumn } = useDiagramStore();
  const {
    activePanel, activePanelNodeId, activePanelColumnId,
    closePanel, openPanel,
  } = useUIStore();
  const { pushSnapshot } = useHistoryStore();

  const isOpen = activePanel === "columnProperties";
  const node   = nodes.find((n) => n.id === activePanelNodeId);
  const column = node?.data.columns.find((c) => c.id === activePanelColumnId);

  const [local, setLocal] = useState<Partial<Column>>({});

  // Sync when column changes
  useEffect(() => {
    if (column) {
      setLocal({
        name:            column.name,
        dataType:        column.dataType,
        isPrimaryKey:    column.isPrimaryKey,
        isForeignKey:    column.isForeignKey,
        isUnique:        column.isUnique,
        isNullable:      column.isNullable,
        defaultValue:    column.defaultValue ?? "",
        referencedTable: column.referencedTable ?? "",
        referencedColumn:column.referencedColumn ?? "",
      });
    }
  }, [column?.id]);

  if (!isOpen || !node || !column) return null;

  const commit = (updates: Partial<Column>) => {
    const next = { ...local, ...updates };
    setLocal(next);
    pushSnapshot();
    updateColumn(node.id, column.id, next as Partial<Column>);
  };

  const tableNames = nodes
    .filter((n) => n.id !== node.id)
    .map((n) => ({ value: n.data.tableName, label: n.data.tableName }));

  const dataTypeOptions = DATA_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
    color: opt.color,
  }));

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
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3
                     border-b border-dark-700 shrink-0"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                openPanel("tableProperties", node.id)
              }
              className="text-xs text-dark-500 hover:text-dark-300
                         transition-colors"
            >
              {node.data.tableName}
            </button>
            <span className="text-dark-700">/</span>
            <span className="text-sm font-semibold text-dark-100 truncate
                             max-w-[120px]">
              {column.name}
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Column name */}
          <Input
            label="Column name"
            value={local.name ?? ""}
            onChange={(e) => setLocal((l) => ({ ...l, name: e.target.value }))}
            onBlur={() => commit({ name: local.name })}
            onKeyDown={(e) =>
              e.key === "Enter" && commit({ name: local.name })
            }
            placeholder="column_name"
          />

          {/* Data type */}
          <div>
            <label className="text-sm font-medium text-dark-200 block mb-1.5">
              Data type
            </label>
            <SelectDropdown
              value={local.dataType ?? "string"}
              onChange={(val) => commit({ dataType: val as DataType })}
              options={dataTypeOptions}
            />
          </div>

          {/* Default value */}
          <Input
            label="Default value"
            value={local.defaultValue ?? ""}
            onChange={(e) =>
              setLocal((l) => ({ ...l, defaultValue: e.target.value }))
            }
            onBlur={() => commit({ defaultValue: local.defaultValue })}
            placeholder="e.g. now(), 0, 'active'"
            hint="Leave empty for no default"
          />

          {/* Constraints */}
          <div>
            <label className="text-xs font-medium text-dark-400 uppercase
                              tracking-wider block mb-2">
              Constraints
            </label>
            <div className="space-y-2">
              <Toggle
                checked={local.isPrimaryKey ?? false}
                onChange={(v) => {
                  commit({
                    isPrimaryKey: v,
                    isNullable:   v ? false : local.isNullable,
                    isUnique:     v ? true  : local.isUnique,
                  });
                }}
                label="Primary Key"
                description="Unique identifier for each row"
                icon={<Key className="w-3.5 h-3.5" />}
                color="amber"
              />

              <Toggle
                checked={local.isForeignKey ?? false}
                onChange={(v) => commit({ isForeignKey: v })}
                label="Foreign Key"
                description="References another table"
                icon={<Link className="w-3.5 h-3.5" />}
                color="blue"
                disabled={local.isPrimaryKey}
              />

              <Toggle
                checked={local.isUnique ?? false}
                onChange={(v) => commit({ isUnique: v })}
                label="Unique"
                description="No duplicate values allowed"
                icon={<Fingerprint className="w-3.5 h-3.5" />}
                color="purple"
                disabled={local.isPrimaryKey}
              />

              <Toggle
                checked={!(local.isNullable ?? true)}
                onChange={(v) => commit({ isNullable: !v })}
                label="Not Null"
                description="Value is required"
                icon={<AlertCircle className="w-3.5 h-3.5" />}
                color="red"
                disabled={local.isPrimaryKey}
              />
            </div>
          </div>

          {/* FK reference fields */}
          {local.isForeignKey && (
            <div
              className="space-y-3 p-3 rounded-xl bg-blue-500/5
                         border border-blue-500/20 animate-fade-in"
            >
              <p className="text-xs text-blue-400 font-medium">
                Foreign Key Reference
              </p>

              <div>
                <label className="text-sm font-medium text-dark-200
                                  block mb-1.5">
                  Referenced table
                </label>
                {tableNames.length > 0 ? (
                  <SelectDropdown
                    value={local.referencedTable ?? ""}
                    onChange={(val) =>
                      commit({ referencedTable: val, referencedColumn: "id" })
                    }
                    options={[
                      { value: "", label: "Select table…" },
                      ...tableNames,
                    ]}
                    placeholder="Select table…"
                  />
                ) : (
                  <p className="text-xs text-dark-500 italic">
                    No other tables available
                  </p>
                )}
              </div>

              {local.referencedTable && (
                <Input
                  label="Referenced column"
                  value={local.referencedColumn ?? "id"}
                  onChange={(e) =>
                    setLocal((l) => ({
                      ...l,
                      referencedColumn: e.target.value,
                    }))
                  }
                  onBlur={() =>
                    commit({ referencedColumn: local.referencedColumn })
                  }
                  placeholder="id"
                  hint="Usually 'id'"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 border-t border-dark-700 shrink-0
                     flex items-center gap-2"
        >
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => openPanel("tableProperties", node.id)}
          >
            ← Back
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={closePanel}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}