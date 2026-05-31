"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  X, Copy, Check, Download, RefreshCw,
  ChevronDown, Code2, Eye, AlertCircle,
  AlertTriangle, Play, Loader2,
} from "lucide-react";
import { useDiagramStore, useUIStore, useHistoryStore } from "../../store";
import { useProjectStore } from "../../store";
import { generateSQL }    from "../../lib/utils/sqlGenerator";
import {
  parseSQL,
  applySmartReplace,
  type SQLParseResult,
} from "../../lib/utils/sqlParser";
import { copyToClipboard, exportToSQL } from "../../lib/utils/exportUtils";
import { toast }  from "../ui/Toast";
import { Button } from "../ui/Button";
import { cn }     from "../../lib/utils/cn";

type PanelMode = "preview" | "edit";

// ── SQL syntax highlighter ────────────────────────────────────────────────

const SQL_KEYWORDS = new Set([
  "CREATE","TABLE","IF","NOT","EXISTS","ALTER","ADD",
  "CONSTRAINT","FOREIGN","KEY","REFERENCES","ON","DELETE",
  "UPDATE","CASCADE","SET","NULL","INDEX","PRIMARY","UNIQUE",
  "DEFAULT","EXTENSION","ENABLE","ROW","LEVEL","SECURITY",
  "INSERT","INTO","VALUES","SERIAL","BIGSERIAL","INTEGER",
  "VARCHAR","TEXT","BOOLEAN","UUID","JSONB","JSON",
  "TIMESTAMP","TIMESTAMPTZ","DATE","FLOAT","DECIMAL",
  "NUMERIC","BIGINT","SMALLINT",
]);

function highlightSQL(sql: string): React.ReactNode[] {
  return sql.split("\n").map((line, lineIdx) => {
    if (line.trimStart().startsWith("--")) {
      return (
        <div key={lineIdx} className="text-dark-500 italic select-none">
          {line}
        </div>
      );
    }
    const tokens = line.split(/(\b[A-Z_]+\b|"[^"]*"|'[^']*'|\b\d+\b)/);
    return (
      <div key={lineIdx}>
        {tokens.map((token, i) => {
          if (!token) return null;
          if (SQL_KEYWORDS.has(token.toUpperCase()))
            return <span key={i} className="text-brand-400 font-semibold">{token}</span>;
          if (token.startsWith('"') && token.endsWith('"'))
            return <span key={i} className="text-emerald-400">{token}</span>;
          if (token.startsWith("'") && token.endsWith("'"))
            return <span key={i} className="text-amber-400">{token}</span>;
          if (/^\d+$/.test(token))
            return <span key={i} className="text-purple-400">{token}</span>;
          return <span key={i} className="text-dark-300">{token}</span>;
        })}
      </div>
    );
  });
}

// ── Parse status indicator ────────────────────────────────────────────────

function ParseStatus({
  errors, warnings, hasReady, isProcessing,
}: {
  errors:       string[];
  warnings:     string[];
  hasReady:     boolean;
  isProcessing: boolean;
}) {
  if (isProcessing)
    return (
      <div className="flex items-center gap-1.5 text-xs text-dark-500">
        <Loader2 className="w-3 h-3 animate-spin" /> Parsing…
      </div>
    );
  if (errors.length > 0)
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-400">
        <AlertCircle className="w-3 h-3" />
        {errors.length} error{errors.length > 1 ? "s" : ""}
      </div>
    );
  if (warnings.length > 0)
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-400">
        <AlertTriangle className="w-3 h-3" />
        {warnings.length} warning{warnings.length > 1 ? "s" : ""}
      </div>
    );
  if (hasReady)
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
        <Check className="w-3 h-3" /> Ready to apply
      </div>
    );
  return null;
}

// ── Main panel ────────────────────────────────────────────────────────────

export function SQLPreviewPanel() {
  const { nodes, edges, setDiagram } = useDiagramStore();
  const { pushSnapshot }             = useHistoryStore();
  const { toggleSQLPanel }           = useUIStore();
  const { currentProject }           = useProjectStore();
  const { fitView }                  = useReactFlow();

  const [mode, setMode]               = useState<PanelMode>("preview");
  const [editSQL, setEditSQL]         = useState("");
  const [copied, setCopied]           = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseErrors, setParseErrors]   = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [parseResult, setParseResult]   = useState<SQLParseResult | null>(null);
  const [applyPreview, setApplyPreview] = useState<{
    added: string[]; replaced: string[]; kept: string[];
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generatedSQL = useMemo(() => generateSQL(nodes, edges), [nodes, edges]);
  const lineCount    = generatedSQL.split("\n").length;

  // Switch to edit mode
  const handleSwitchToEdit = () => {
    setEditSQL(generatedSQL);
    setMode("edit");
    setParseErrors([]);
    setParseWarnings([]);
    setParseResult(null);
    setApplyPreview(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // Live debounced parse
  const handleSQLChange = useCallback(
    (value: string) => {
      setEditSQL(value);
      setIsProcessing(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        try {
          const result = parseSQL(value);
          setParseResult(result);
          setParseErrors(result.errors);
          setParseWarnings(result.warnings);

          if (result.tables.length > 0) {
            const { replaced, kept, added } = applySmartReplace(
              result, nodes, edges
            );
            setApplyPreview({ added, replaced, kept });
          } else {
            setApplyPreview(null);
          }
        } catch (err) {
          setParseErrors([err instanceof Error ? err.message : "Parse failed"]);
          setParseResult(null);
          setApplyPreview(null);
        } finally {
          setIsProcessing(false);
        }
      }, 600);
    },
    [nodes, edges]
  );

  // Apply to diagram
  const handleApply = useCallback(() => {
    if (parseErrors.length > 0) {
      toast.error("Cannot apply", "Fix the SQL errors before applying.");
      return;
    }
    if (!parseResult || parseResult.tables.length === 0) {
      toast.info("Nothing to apply", "No valid CREATE TABLE statements found.");
      return;
    }

    pushSnapshot();

    const {
      nodes: nextNodes,
      edges: nextEdges,
      replaced, kept, added,
    } = applySmartReplace(parseResult, nodes, edges);

    setDiagram({ nodes: nextNodes, edges: nextEdges });

    // Fit view so no tables are off-screen
    setTimeout(() => fitView({ padding: 0.12, duration: 600 }), 150);

    const parts: string[] = [];
    if (added.length    > 0) parts.push(`Added ${added.length} table${added.length > 1 ? "s" : ""}`);
    if (replaced.length > 0) parts.push(`Replaced ${replaced.length}`);
    if (kept.length     > 0) parts.push(`Kept ${kept.length} unchanged`);

    toast.success("Diagram updated", parts.join(" · "));

    setMode("preview");
    setParseResult(null);
    setApplyPreview(null);
    setParseErrors([]);
    setParseWarnings([]);
  }, [parseResult, parseErrors, nodes, edges, pushSnapshot, setDiagram, fitView]);

  // Copy SQL
  const handleCopy = async () => {
    const sql = mode === "edit" ? editSQL : generatedSQL;
    const ok  = await copyToClipboard(sql);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleDownload = () =>
    exportToSQL(generatedSQL, currentProject?.project_name ?? "schema");

  // Cleanup debounce
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-dark-900 border-l border-dark-800">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-dark-800 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed((c) => !c)}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              isCollapsed && "-rotate-90"
            )} />
          </button>
          <h3 className="text-sm font-semibold text-dark-100">SQL</h3>

          {!isCollapsed && (
            <div className="flex items-center gap-0.5 bg-dark-950/60
                            rounded-lg p-0.5 ml-1">
              <button
                onClick={() => setMode("preview")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md",
                  "text-xs font-medium transition-all duration-150",
                  mode === "preview"
                    ? "bg-dark-700 text-dark-100"
                    : "text-dark-500 hover:text-dark-300"
                )}
              >
                <Eye className="w-3 h-3" /> Preview
              </button>
              <button
                onClick={handleSwitchToEdit}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md",
                  "text-xs font-medium transition-all duration-150",
                  mode === "edit"
                    ? "bg-dark-700 text-dark-100"
                    : "text-dark-500 hover:text-dark-300"
                )}
              >
                <Code2 className="w-3 h-3" /> Edit SQL
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {mode === "preview" && !isCollapsed && (
            <>
              <span className="text-[10px] px-1.5 py-0.5 rounded
                               bg-dark-800 border border-dark-700
                               text-dark-500 font-mono">
                {lineCount} lines
              </span>
              <button
                onClick={handleCopy}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-lg",
                  "text-xs transition-all duration-200",
                  copied
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-dark-400 hover:text-dark-200 hover:bg-dark-700"
                )}
                title="Copy SQL"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleDownload}
                className="w-7 h-7 flex items-center justify-center rounded-lg
                           text-dark-400 hover:text-dark-200 hover:bg-dark-700
                           transition-all duration-200"
                title="Download .sql"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={toggleSQLPanel}
            className="w-7 h-7 flex items-center justify-center rounded-lg
                       text-dark-400 hover:text-dark-200 hover:bg-dark-700
                       transition-all duration-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      {!isCollapsed && (
        <div className="flex items-center gap-3 px-4 py-2 border-b
                        border-dark-800 bg-dark-950/50 shrink-0">
          <span className="text-xs text-dark-500">
            <span className="text-brand-400 font-semibold">{nodes.length}</span>
            {" "}table{nodes.length !== 1 ? "s" : ""}
          </span>
          <span className="text-dark-700">·</span>
          <span className="text-xs text-dark-500">
            <span className="text-emerald-400 font-semibold">{edges.length}</span>
            {" "}rel{edges.length !== 1 ? "s" : ""}
          </span>
          <span className="text-dark-700">·</span>
          <span className="text-xs text-dark-500">
            <span className="text-amber-400 font-semibold">
              {nodes.reduce((a, n) => a + n.data.columns.length, 0)}
            </span>
            {" "}columns
          </span>
          {mode === "edit" && (
            <>
              <span className="text-dark-700">·</span>
              <ParseStatus
                errors={parseErrors}
                warnings={parseWarnings}
                hasReady={!!applyPreview}
                isProcessing={isProcessing}
              />
            </>
          )}
        </div>
      )}

      {/* Body */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* PREVIEW MODE */}
          {mode === "preview" && (
            <div className="flex-1 overflow-auto">
              <pre className="font-mono text-[11px] leading-relaxed p-4
                              min-h-full whitespace-pre-wrap break-words">
                {highlightSQL(generatedSQL)}
              </pre>
            </div>
          )}

          {/* EDIT MODE */}
          {mode === "edit" && (
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* SQL textarea */}
              <div className="flex-1 relative overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={editSQL}
                  onChange={(e) => handleSQLChange(e.target.value)}
                  spellCheck={false}
                  placeholder={
                    "-- Paste or type SQL here\n" +
                    "-- Supports: CREATE TABLE, ALTER TABLE, INSERT INTO\n\n" +
                    'CREATE TABLE "users" (\n' +
                    '  "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,\n' +
                    '  "email" VARCHAR(255) NOT NULL UNIQUE,\n' +
                    '  "created_at" TIMESTAMPTZ DEFAULT NOW()\n' +
                    ');'
                  }
                  className="absolute inset-0 w-full h-full resize-none
                             font-mono text-[11px] leading-relaxed p-4
                             bg-dark-950 text-dark-200 focus:outline-none
                             placeholder-dark-700 border-0"
                />
              </div>

              {/* Errors & warnings */}
              {(parseErrors.length > 0 || parseWarnings.length > 0) && (
                <div className="border-t border-dark-800 bg-dark-950/80
                                px-4 py-3 space-y-2 max-h-36 overflow-y-auto
                                shrink-0">
                  {parseErrors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-400">
                      <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                  {parseWarnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-400">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Apply preview — Add / Replace / Keep */}
              {applyPreview && !isProcessing && (
                <div className="border-t border-dark-800 px-4 py-3 shrink-0
                                space-y-2 bg-dark-950/40">

                  {applyPreview.added.length > 0 && (
                    <div>
                      <p className="text-[10px] text-emerald-400 font-semibold
                                    uppercase tracking-wider mb-1">
                        ＋ Add {applyPreview.added.length} new
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {applyPreview.added.map((name) => (
                          <span key={name}
                                className="text-[10px] font-mono px-1.5 py-0.5
                                           rounded bg-emerald-500/10 border
                                           border-emerald-500/20 text-emerald-400">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {applyPreview.replaced.length > 0 && (
                    <div>
                      <p className="text-[10px] text-amber-400 font-semibold
                                    uppercase tracking-wider mb-1">
                        ↺ Replace {applyPreview.replaced.length} existing
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {applyPreview.replaced.map((name) => (
                          <span key={name}
                                className="text-[10px] font-mono px-1.5 py-0.5
                                           rounded bg-amber-500/10 border
                                           border-amber-500/20 text-amber-400">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {applyPreview.kept.length > 0 && (
                    <div>
                      <p className="text-[10px] text-dark-500 font-semibold
                                    uppercase tracking-wider mb-1">
                        ○ Keep {applyPreview.kept.length} unchanged
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {applyPreview.kept.map((name) => (
                          <span key={name}
                                className="text-[10px] font-mono px-1.5 py-0.5
                                           rounded bg-dark-800 border
                                           border-dark-700 text-dark-500">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auto-relationship note */}
                  <div className="flex items-center gap-1.5 pt-1
                                  border-t border-dark-800">
                    <span className="text-[10px] text-brand-400">⟷</span>
                    <span className="text-[10px] text-dark-500">
                      Relationships auto-generated from FK columns
                    </span>
                  </div>
                </div>
              )}

              {/* Apply / Cancel buttons */}
              <div className="border-t border-dark-800 px-4 py-3 shrink-0
                              flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setMode("preview")}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handleApply}
                  disabled={
                    isProcessing ||
                    parseErrors.length > 0 ||
                    !parseResult ||
                    parseResult.tables.length === 0
                  }
                  isLoading={isProcessing}
                  leftIcon={!isProcessing ? <Play className="w-3 h-3" /> : undefined}
                >
                  Apply to Diagram
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer — preview mode only */}
      {!isCollapsed && mode === "preview" && (
        <div className="flex items-center gap-2 px-4 py-2 border-t
                        border-dark-800 bg-dark-950/30 shrink-0">
          <RefreshCw className="w-3 h-3 text-dark-600 animate-spin-slow" />
          <span className="text-[10px] text-dark-600">
            Auto-updates as you edit ·{" "}
            <button
              onClick={handleSwitchToEdit}
              className="text-brand-500 hover:text-brand-400
                         transition-colors underline underline-offset-2"
            >
              Edit SQL
            </button>{" "}
            to import
          </span>
        </div>
      )}
    </div>
  );
}