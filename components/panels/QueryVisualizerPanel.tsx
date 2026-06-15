"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Search,
  X,
  Play,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Table2,
  Columns,
  Filter,
  Group,
  Zap,
} from "lucide-react";
import { useDiagramStore } from "../../store";
import { parseQuery, getColumnClauses } from "../../lib/utils/queryParser";
import type { ParsedQuery, ClauseTag } from "../../lib/utils/queryParser";
import { cn } from "../../lib/utils/cn";
import { QueryJoinFlow } from "./QueryJoinFlow";

interface QueryVisualizerPanelProps {
  onClose: () => void;
}

// ── Clause badge colors ───────────────────────────────────────────────────

const CLAUSE_STYLES: Record<ClauseTag, string> = {
  SELECT:    "bg-brand-500/15 text-brand-300 border-brand-500/30",
  JOIN:      "bg-blue-500/15 text-blue-300 border-blue-500/30",
  WHERE:     "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "GROUP BY":"bg-violet-500/15 text-violet-300 border-violet-500/30",
  HAVING:    "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const JOIN_TYPE_STYLES: Record<string, string> = {
  INNER: "bg-blue-500/10 text-blue-300 border-blue-400/30",
  LEFT:  "bg-teal-500/10 text-teal-300 border-teal-400/30",
  RIGHT: "bg-purple-500/10 text-purple-300 border-purple-400/30",
  FULL:  "bg-orange-500/10 text-orange-300 border-orange-400/30",
  CROSS: "bg-red-500/10 text-red-300 border-red-400/30",
};

function ClauseBadge({ tag }: { tag: ClauseTag }) {
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 rounded text-[10px] font-semibold border",
        CLAUSE_STYLES[tag]
      )}
    >
      {tag}
    </span>
  );
}

// ── Table result card ─────────────────────────────────────────────────────

function TableResultCard({
  tableName,
  parsed,
  existsOnCanvas,
}: {
  tableName: string;
  parsed: ParsedQuery;
  existsOnCanvas: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const highlightedCols = parsed.highlightMap[tableName];

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden",
        existsOnCanvas
          ? "border-brand-500/30 bg-brand-500/5"
          : "border-dark-700 bg-dark-800/40"
      )}
    >
      {/* Table header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-dark-700/30 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-dark-400 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-dark-400 shrink-0" />
        )}
        <Table2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
        <span className="text-sm font-medium text-dark-100 flex-1 truncate">
          {tableName}
        </span>
        {!existsOnCanvas && (
          <span className="text-[10px] text-dark-500 shrink-0">
            not on canvas
          </span>
        )}
        {highlightedCols && (
          <span className="text-[10px] text-brand-400 shrink-0">
            {highlightedCols.size} col{highlightedCols.size !== 1 ? "s" : ""}
          </span>
        )}
      </button>

      {/* Columns used */}
      {expanded && highlightedCols && highlightedCols.size > 0 && (
        <div className="border-t border-dark-700/60 px-3 py-2 space-y-1.5">
          {Array.from(highlightedCols).map((col) => {
            const clauses = getColumnClauses(parsed, tableName, col);
            return (
              <div key={col} className="flex items-center gap-2">
                <span className="font-mono text-xs text-dark-200 flex-1 truncate">
                  {col}
                </span>
                <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                  {clauses.map((c) => (
                    <ClauseBadge key={c} tag={c} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Example queries ───────────────────────────────────────────────────────

const EXAMPLES = [
  {
    label: "Simple JOIN",
    sql: `SELECT u.id, u.name, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.is_active = true`,
  },
  {
    label: "Multi JOIN",
    sql: `SELECT o.id, u.name, p.title, oi.quantity
FROM orders o
INNER JOIN users u ON o.user_id = u.id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
WHERE o.status = 'pending'`,
  },
  {
    label: "GROUP BY + HAVING",
    sql: `SELECT u.id, u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 5`,
  },
];

// ── Main panel ────────────────────────────────────────────────────────────

export function QueryVisualizerPanel({ onClose }: QueryVisualizerPanelProps) {
  const { nodes, edges } = useDiagramStore();
  const setHighlighted = useDiagramStore((s) => s.setHighlighted);

  const [query, setQuery] = useState("");
  const [parsed, setParsed] = useState<ParsedQuery | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [activeTab, setActiveTab] = useState<"tables" | "joins">("tables");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Canvas table names for matching
  const canvasTableNames = new Set(
    nodes.map((n) => n.data.tableName as string)
  );

  // ── Run query parse ────────────────────────────────────────────────────
  const handleRun = useCallback(() => {
    if (!query.trim()) return;
    const result = parseQuery(query);
    setParsed(result);

    if (!result.isValid) return;

    // Highlight matching canvas nodes
    const matchedNode = nodes.find((n) =>
      result.tables.includes(n.data.tableName as string)
    );

    if (matchedNode) {
      // Use setHighlighted to fade unrelated tables
      // We highlight the first FROM table; connected nodes will auto-highlight
      // via the existing setHighlighted logic
      result.tables.forEach((tableName) => {
        const node = nodes.find((n) => n.data.tableName === tableName);
        if (node) setHighlighted(node.id);
      });
    }
  }, [query, nodes, setHighlighted]);

  // ── Reset ──────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setQuery("");
    setParsed(null);
    setHighlighted(null);
    setShowExamples(false);
  }, [setHighlighted]);

  // Clear highlights on unmount
  useEffect(() => {
    return () => { setHighlighted(null); };
  }, [setHighlighted]);

  // Highlight all query tables on canvas when parsed
  useEffect(() => {
    if (!parsed?.isValid) return;

    // Apply faded state to non-query tables, highlight query tables
    useDiagramStore.setState((state) => ({
      nodes: state.nodes.map((n) => {
        const tableName = n.data.tableName as string;
        const isInQuery = parsed.tables.includes(tableName);
        return {
          ...n,
          data: {
            ...n.data,
            isHighlighted: isInQuery,
            isFaded: !isInQuery,
          },
        };
      }),
    }));
  }, [parsed]);

  // Ctrl+Enter to run
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    },
    [handleRun]
  );

  // ── Stats summary ──────────────────────────────────────────────────────
  const matchedTables = parsed?.isValid
    ? parsed.tables.filter((t) => canvasTableNames.has(t))
    : [];
  const missingTables = parsed?.isValid
    ? parsed.tables.filter((t) => !canvasTableNames.has(t))
    : [];

  return (
    <div className="flex flex-col h-full bg-dark-900 text-dark-100">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800 shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold">Query Visualizer</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-dark-800 text-dark-400
                     hover:text-dark-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Query editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-dark-300">
              SQL Query
            </label>
            <button
              onClick={() => setShowExamples((p) => !p)}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              {showExamples ? "Hide examples" : "Show examples"}
            </button>
          </div>

          {/* Example queries */}
          {showExamples && (
            <div className="space-y-1.5 p-2 rounded-lg bg-dark-800 border border-dark-700">
              <p className="text-[10px] text-dark-500 font-medium uppercase tracking-wide px-1">
                Click to load
              </p>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => {
                    setQuery(ex.sql);
                    setShowExamples(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-xs
                             text-dark-300 hover:bg-dark-700 hover:text-dark-100
                             transition-colors"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          )}

          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`SELECT u.id, u.name, o.total\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.is_active = true`}
              rows={7}
              className={cn(
                "w-full px-3 py-2.5 rounded-lg text-xs font-mono resize-none",
                "bg-dark-800 border border-dark-700 text-dark-100",
                "placeholder:text-dark-600 focus:outline-none",
                "focus:ring-1 focus:ring-brand-500 focus:border-brand-500/50",
                "transition-colors"
              )}
              spellCheck={false}
            />
            <span className="absolute bottom-2 right-2 text-[10px] text-dark-600">
              Ctrl+↵ to run
            </span>
          </div>

          {/* Error */}
          {parsed && !parsed.isValid && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                            bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {parsed.error}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={!query.trim()}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2",
              "rounded-lg text-xs font-medium transition-colors",
              query.trim()
                ? "bg-brand-600 hover:bg-brand-500 text-white"
                : "bg-dark-800 text-dark-600 cursor-not-allowed"
            )}
          >
            <Play className="w-3.5 h-3.5" />
            Visualize
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg text-xs font-medium
                       border border-dark-700 text-dark-400
                       hover:bg-dark-800 hover:text-dark-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results */}
        {parsed?.isValid && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-dark-800 border border-dark-700 p-2.5 text-center">
                <p className="text-lg font-bold text-brand-400">
                  {parsed.tables.length}
                </p>
                <p className="text-[10px] text-dark-500 mt-0.5">Tables</p>
              </div>
              <div className="rounded-lg bg-dark-800 border border-dark-700 p-2.5 text-center">
                <p className="text-lg font-bold text-blue-400">
                  {parsed.joins.length}
                </p>
                <p className="text-[10px] text-dark-500 mt-0.5">JOINs</p>
              </div>
              <div className="rounded-lg bg-dark-800 border border-dark-700 p-2.5 text-center">
                <p className="text-lg font-bold text-amber-400">
                  {parsed.whereColumns.length}
                </p>
                <p className="text-[10px] text-dark-500 mt-0.5">Filters</p>
              </div>
            </div>

            {/* Canvas match summary */}
            {matchedTables.length > 0 && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg
                              bg-green-500/10 border border-green-500/20 text-xs">
                <span className="text-green-400 font-medium shrink-0">
                  ✓ {matchedTables.length} table{matchedTables.length !== 1 ? "s" : ""} highlighted on canvas
                </span>
              </div>
            )}
            {missingTables.length > 0 && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg
                              bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Not on canvas:{" "}
                  <span className="font-mono">
                    {missingTables.join(", ")}
                  </span>
                </span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-dark-800">
              {(["tables", "joins"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px",
                    activeTab === tab
                      ? "border-brand-500 text-brand-400"
                      : "border-transparent text-dark-500 hover:text-dark-300"
                  )}
                >
                  {tab === "tables" ? (
                    <span className="flex items-center gap-1.5">
                      <Columns className="w-3 h-3" />
                      Tables & Columns
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Filter className="w-3 h-3" />
                      Join Flow
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab: Tables & Columns */}
            {activeTab === "tables" && (
              <div className="space-y-2">
                {/* Clause legend */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {(Object.keys(CLAUSE_STYLES) as ClauseTag[]).map((tag) => (
                    <ClauseBadge key={tag} tag={tag} />
                  ))}
                </div>

                {parsed.tables.map((tableName) => (
                  <TableResultCard
                    key={tableName}
                    tableName={tableName}
                    parsed={parsed}
                    existsOnCanvas={canvasTableNames.has(tableName)}
                  />
                ))}

                {/* WHERE summary */}
                {parsed.whereColumns.length > 0 && (
                  <div className="rounded-lg border border-amber-500/20
                                  bg-amber-500/5 px-3 py-2.5 space-y-1.5">
                    <p className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                      <Filter className="w-3 h-3" />
                      WHERE filters
                    </p>
                    {parsed.whereColumns.map((col, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-dark-300">
                          {col.table ? `${col.table}.` : ""}{col.column}
                        </span>
                        <span className="text-dark-600">{col.operator}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* GROUP BY summary */}
                {parsed.groupByColumns.length > 0 && (
                  <div className="rounded-lg border border-violet-500/20
                                  bg-violet-500/5 px-3 py-2.5 space-y-1.5">
                    <p className="text-xs font-medium text-violet-400 flex items-center gap-1.5">
                      <Group className="w-3 h-3" />
                      GROUP BY
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {parsed.groupByColumns.map((col, i) => (
                        <span key={i}
                          className="font-mono text-xs px-2 py-0.5 rounded
                                     bg-dark-700 text-dark-300">
                          {col.table ? `${col.table}.` : ""}{col.column}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Join Flow */}
            {activeTab === "joins" && (
              <QueryJoinFlow parsed={parsed} />
            )}
          </>
        )}

        {/* Empty state */}
        {!parsed && (
          <div className="flex flex-col items-center justify-center gap-3
                          py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-dark-800 border border-dark-700
                            flex items-center justify-center">
              <Search className="w-5 h-5 text-dark-500" />
            </div>
            <div>
              <p className="text-sm text-dark-400 font-medium">
                Paste a SELECT query
              </p>
              <p className="text-xs text-dark-600 mt-1">
                Tables will highlight on canvas,<br />
                joins shown as a flow diagram
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}