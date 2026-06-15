"use client";

import { useState, useCallback } from "react";
import {
  Database,
  X,
  Plug,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  ChevronDown,
  ChevronRight,
  Table2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useDiagramStore } from "../../store";
import {
  validateConnectionString,
  maskConnectionString,
} from "../../lib/utils/connectionStringParser";
import { cn } from "../../lib/utils/cn";
import type {
  DBImportResult,
  ImportedTable,
} from "../../app/api/db-import/route";
import type { Column } from "../../types/column";
import type { DataType } from "../../types/column";

interface DBImportPanelProps {
  onClose: () => void;
}

type Step = "connect" | "preview" | "importing";

interface TestResult {
  ok: boolean;
  db?: string;
  version?: string;
  error?: string;
}

// ── Small sub-components ───────────────────────────────────────────────────

function StatusBadge({ ok, message }: { ok: boolean; message: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium",
        ok
          ? "bg-green-500/10 text-green-400 border border-green-500/20"
          : "bg-red-500/10 text-red-400 border border-red-500/20",
      )}
    >
      {ok ? (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      )}
      <span className="truncate">{message}</span>
    </div>
  );
}

function TablePreviewRow({
  table,
  selected,
  onToggle,
}: {
  table: ImportedTable;
  selected: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-colors",
        selected
          ? "border-brand-500/40 bg-brand-500/5"
          : "border-dark-700 bg-dark-800/50",
      )}
    >
      {/* Table header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Select checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-3.5 h-3.5 rounded accent-brand-500 cursor-pointer shrink-0"
        />

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-dark-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-dark-400 shrink-0" />
          )}
          <Table2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="text-sm font-medium text-dark-100 truncate">
            {table.tableName}
          </span>
          <span className="text-xs text-dark-500 shrink-0">
            {table.columns.length} cols
          </span>
        </button>
      </div>

      {/* Expanded columns */}
      {expanded && (
        <div className="border-t border-dark-700 px-3 py-2 space-y-1">
          {table.columns.map((col) => (
            <div
              key={col.name}
              className="flex items-center gap-2 text-xs text-dark-400"
            >
              <span
                className={cn(
                  "font-mono truncate",
                  col.isPrimaryKey && "text-yellow-400",
                  col.isForeignKey && !col.isPrimaryKey && "text-blue-400",
                )}
              >
                {col.name}
              </span>
              <span className="text-dark-600 shrink-0">{col.dataType}</span>
              <div className="flex gap-1 ml-auto shrink-0">
                {col.isPrimaryKey && (
                  <span className="px-1 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-[10px]">
                    PK
                  </span>
                )}
                {col.isForeignKey && (
                  <span className="px-1 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px]">
                    FK
                  </span>
                )}
                {!col.isNullable && (
                  <span className="px-1 py-0.5 bg-dark-700 text-dark-400 rounded text-[10px]">
                    NN
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────

export function DBImportPanel({ onClose }: DBImportPanelProps) {
  const { nodes, addTableWithData, addRelationship } = useDiagramStore();

  const [step, setStep] = useState<Step>("connect");
  const [connectionString, setConnectionString] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [importResult, setImportResult] = useState<DBImportResult | null>(null);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState(false);

  const validation = validateConnectionString(connectionString);

  // ── Test connection ──────────────────────────────────────────────────────
  const handleTest = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const res = await fetch(
        `/api/db-import?connectionString=${encodeURIComponent(connectionString)}`,
      );
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({
        ok: false,
        error: "Network error — could not reach server.",
      });
    } finally {
      setIsTesting(false);
    }
  }, [connectionString]);

  // ── Fetch schema ─────────────────────────────────────────────────────────
  const handleFetchSchema = useCallback(async () => {
    setIsImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/db-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionString }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to fetch schema");
        setIsImporting(false);
        return;
      }

      setImportResult(data as DBImportResult);
      // Select all tables by default
      setSelectedTables(
        new Set(data.tables.map((t: ImportedTable) => t.tableName)),
      );
      setStep("preview");
    } catch {
      setError("Network error — could not reach server.");
    } finally {
      setIsImporting(false);
    }
  }, [connectionString]);

  // ── Import selected tables into canvas ───────────────────────────────────
  const handleImport = useCallback(() => {
    if (!importResult) return;

    setStep("importing");

    const existingTableNames = new Set(
      nodes.map((n) => n.data?.tableName as string).filter(Boolean),
    );

    const COLS = 4;
    const CELL_W = 320;
    const CELL_H = 220;
    const OFFSET_X = 80;
    const OFFSET_Y = 80;

    const tablesToImport = importResult.tables.filter(
      (t) =>
        selectedTables.has(t.tableName) && !existingTableNames.has(t.tableName),
    );

    // Add tables with full data
    const addedIds: Record<string, string> = {};

    tablesToImport.forEach((table, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);

      const columns: Column[] = table.columns.map((c, order) => ({
        id: crypto.randomUUID(),
        name: c.name,
        dataType: c.dataType as DataType,
        isPrimaryKey: c.isPrimaryKey,
        isForeignKey: c.isForeignKey,
        isUnique: c.isPrimaryKey,
        isNullable: c.isNullable,
        defaultValue: c.defaultValue,
        referencedTable: c.referencedTable,
        referencedColumn: c.referencedColumn,
        order,
      }));

      const id = addTableWithData(
        { x: OFFSET_X + col * CELL_W, y: OFFSET_Y + row * CELL_H },
        { tableName: table.tableName, columns },
      );

      if (id) addedIds[table.tableName] = id;
    });

    // Add FK edges
    const allKnownIds: Record<string, string> = {
      ...addedIds,
      // also map existing nodes by tableName → id
      ...Object.fromEntries(
        nodes
          .filter((n) => n.data?.tableName)
          .map((n) => [n.data.tableName as string, n.id]),
      ),
    };

    for (const rel of importResult.relationships) {
      const sourceId = allKnownIds[rel.fromTable];
      const targetId = allKnownIds[rel.toTable];

      if (
        sourceId &&
        targetId &&
        selectedTables.has(rel.fromTable) &&
        selectedTables.has(rel.toTable)
      ) {
        addRelationship(sourceId, targetId, "one-to-many");
      }
    }

    setImportDone(true);
    setStep("preview");
  }, [importResult, selectedTables, nodes, addTableWithData, addRelationship]);

  const toggleTable = (name: string) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleAll = () => {
    if (!importResult) return;
    const allNames = importResult.tables.map((t) => t.tableName);
    setSelectedTables(
      selectedTables.size === allNames.length ? new Set() : new Set(allNames),
    );
  };

  // ── Display connection string (masked when not focused) ──────────────────
  const displayValue = showPassword
    ? connectionString
    : connectionString
      ? maskConnectionString(connectionString)
      : "";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-dark-900 text-dark-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800 shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-semibold">Import from PostgreSQL</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-dark-800 text-dark-400 hover:text-dark-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 px-4 py-2 border-b border-dark-800 shrink-0">
        {(["connect", "preview"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-0">
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs px-2 py-1 rounded",
                step === s
                  ? "text-brand-400 font-medium"
                  : i < ["connect", "preview"].indexOf(step)
                    ? "text-green-400"
                    : "text-dark-500",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border",
                  step === s
                    ? "border-brand-500 text-brand-400"
                    : i < ["connect", "preview"].indexOf(step)
                      ? "border-green-500 text-green-400"
                      : "border-dark-600 text-dark-500",
                )}
              >
                {i < ["connect", "preview"].indexOf(step) ? "✓" : i + 1}
              </span>
              {s === "connect" ? "Connect" : "Select Tables"}
            </div>
            {i < 1 && <div className="w-4 h-px bg-dark-700 mx-1" />}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Step 1: Connect ───────────────────────────────────────────── */}
        {step === "connect" && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-dark-300">
                Connection String
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={connectionString}
                  onChange={(e) => {
                    setConnectionString(e.target.value);
                    setTestResult(null);
                    setError(null);
                  }}
                  placeholder="postgresql://user:password@host:5432/dbname"
                  className={cn(
                    "w-full px-3 py-2 pr-9 rounded-lg text-xs font-mono",
                    "bg-dark-800 border text-dark-100 placeholder:text-dark-600",
                    "focus:outline-none focus:ring-1 focus:ring-brand-500",
                    !connectionString
                      ? "border-dark-700"
                      : validation.valid
                        ? "border-green-500/40"
                        : "border-red-500/40",
                  )}
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Inline validation hint */}
              {connectionString && !validation.valid && (
                <p className="text-xs text-red-400">{validation.hint}</p>
              )}

              <p className="text-xs text-dark-500">
                Format:{" "}
                <span className="font-mono text-dark-400">
                  postgresql://user:pass@host:5432/dbname
                </span>
              </p>
            </div>

            {/* Test result */}
            {testResult && (
              <StatusBadge
                ok={testResult.ok}
                message={
                  testResult.ok
                    ? `Connected to "${testResult.db}" · ${testResult.version}`
                    : (testResult.error ?? "Connection failed")
                }
              />
            )}

            {/* Error */}
            {error && <StatusBadge ok={false} message={error} />}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleTest}
                disabled={!validation.valid || isTesting}
                className={cn(
                  "flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg",
                  "text-xs font-medium border transition-colors",
                  validation.valid && !isTesting
                    ? "border-dark-600 text-dark-200 hover:bg-dark-800 hover:border-dark-500"
                    : "border-dark-700 text-dark-600 cursor-not-allowed",
                )}
              >
                {isTesting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plug className="w-3.5 h-3.5" />
                )}
                {isTesting ? "Testing…" : "Test Connection"}
              </button>

              <button
                onClick={handleFetchSchema}
                disabled={!validation.valid || isImporting}
                className={cn(
                  "flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg",
                  "text-xs font-medium transition-colors",
                  validation.valid && !isImporting
                    ? "bg-brand-600 hover:bg-brand-500 text-white"
                    : "bg-dark-800 text-dark-600 cursor-not-allowed",
                )}
              >
                {isImporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {isImporting ? "Fetching schema…" : "Fetch Schema"}
              </button>
            </div>

            {/* Info box */}
            <div className="rounded-lg bg-dark-800 border border-dark-700 p-3 space-y-1.5">
              <p className="text-xs font-medium text-dark-300">
                What gets imported
              </p>
              <ul className="text-xs text-dark-500 space-y-1">
                <li className="flex gap-2">
                  <span className="text-brand-400">•</span> All tables from the{" "}
                  <span className="font-mono text-dark-400">public</span> schema
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-400">•</span> Columns with types,
                  PK, FK, nullable flags
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-400">•</span> Foreign key
                  relationships as edges
                </li>
              </ul>
            </div>
          </>
        )}

        {/* ── Step 2: Preview & select tables ───────────────────────────── */}
        {step === "preview" && importResult && (
          <>
            {/* Stats bar */}
            <div className="flex items-center justify-between text-xs text-dark-400">
              <span>
                <span className="text-dark-100 font-medium">
                  {importResult.tables.length}
                </span>{" "}
                tables ·{" "}
                <span className="text-dark-100 font-medium">
                  {importResult.relationships.length}
                </span>{" "}
                relationships
              </span>
              <button
                onClick={toggleAll}
                className="text-brand-400 hover:text-brand-300 font-medium"
              >
                {selectedTables.size === importResult.tables.length
                  ? "Deselect all"
                  : "Select all"}
              </button>
            </div>

            {/* Table list */}
            <div className="space-y-2">
              {importResult.tables.map((table) => (
                <TablePreviewRow
                  key={table.tableName}
                  table={table}
                  selected={selectedTables.has(table.tableName)}
                  onToggle={() => toggleTable(table.tableName)}
                />
              ))}
            </div>

            {/* Import done notice */}
            {importDone && (
              <StatusBadge
                ok={true}
                message={`${selectedTables.size} table(s) added to canvas`}
              />
            )}

            {error && <StatusBadge ok={false} message={error} />}
          </>
        )}

        {/* ── Step: Importing spinner ────────────────────────────────────── */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
            <p className="text-sm text-dark-400">Adding tables to canvas…</p>
          </div>
        )}
      </div>

      {/* Footer — only on preview step */}
      {step === "preview" && !importDone && (
        <div className="shrink-0 px-4 py-3 border-t border-dark-800 flex gap-2">
          <button
            onClick={() => setStep("connect")}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium
                       border border-dark-700 text-dark-300
                       hover:bg-dark-800 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleImport}
            disabled={selectedTables.size === 0}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2",
              "rounded-lg text-xs font-medium transition-colors",
              selectedTables.size > 0
                ? "bg-brand-600 hover:bg-brand-500 text-white"
                : "bg-dark-800 text-dark-600 cursor-not-allowed",
            )}
          >
            <Download className="w-3.5 h-3.5" />
            Import {selectedTables.size} table
            {selectedTables.size !== 1 ? "s" : ""}
          </button>
        </div>
      )}

      {/* Footer — after import done */}
      {importDone && (
        <div className="shrink-0 px-4 py-3 border-t border-dark-800">
          <button
            onClick={onClose}
            className="w-full px-3 py-2 rounded-lg text-xs font-medium
                       bg-brand-600 hover:bg-brand-500 text-white transition-colors"
          >
            Done — View Canvas
          </button>
        </div>
      )}
    </div>
  );
}
