"use client";

import { useMemo } from "react";
import type { ParsedQuery, ParsedJoin } from "../../lib/utils/queryParser";
import { cn } from "../../lib/utils/cn";

interface QueryJoinFlowProps {
  parsed: ParsedQuery;
}

// ── Join type colors ──────────────────────────────────────────────────────

const JOIN_COLORS: Record<string, { bg: string; border: string; text: string; line: string }> = {
  INNER: { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-300",   line: "#3b82f6" },
  LEFT:  { bg: "bg-teal-500/10",   border: "border-teal-500/30",   text: "text-teal-300",   line: "#14b8a6" },
  RIGHT: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-300", line: "#8b5cf6" },
  FULL:  { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-300", line: "#f97316" },
  CROSS: { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-300",    line: "#ef4444" },
};

// ── Venn diagram SVG for join type ────────────────────────────────────────

function JoinVenn({ type }: { type: string }) {
  const color = JOIN_COLORS[type] ?? JOIN_COLORS.INNER;

  // Which parts are filled based on join type
  const fillLeft   = type === "LEFT"  || type === "FULL";
  const fillRight  = type === "RIGHT" || type === "FULL";
  const fillCenter = type !== "CROSS";

  return (
    <svg width="36" height="24" viewBox="0 0 36 24" fill="none">
      {/* Left circle */}
      <circle
        cx="13" cy="12" r="9"
        fill={fillLeft ? color.line : "transparent"}
        fillOpacity={fillLeft ? 0.25 : 0}
        stroke={color.line}
        strokeOpacity={0.6}
        strokeWidth="1.5"
      />
      {/* Right circle */}
      <circle
        cx="23" cy="12" r="9"
        fill={fillRight ? color.line : "transparent"}
        fillOpacity={fillRight ? 0.25 : 0}
        stroke={color.line}
        strokeOpacity={0.6}
        strokeWidth="1.5"
      />
      {/* Center intersection highlight */}
      {fillCenter && (
        <ellipse
          cx="18" cy="12" rx="4" ry="7.5"
          fill={color.line}
          fillOpacity={0.35}
        />
      )}
    </svg>
  );
}

// ── Single join card ──────────────────────────────────────────────────────

function JoinCard({ join, index }: { join: ParsedJoin; index: number }) {
  const color = JOIN_COLORS[join.type] ?? JOIN_COLORS.INNER;

  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-2.5",
      color.bg, color.border
    )}>
      {/* Join type header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <JoinVenn type={join.type} />
          <span className={cn("text-xs font-bold", color.text)}>
            {join.type} JOIN
          </span>
        </div>
        <span className="text-[10px] text-dark-500 font-mono">#{index + 1}</span>
      </div>

      {/* Table connection row */}
      <div className="flex items-center gap-1.5">
        {/* Left table */}
        <div className="flex-1 min-w-0 rounded bg-dark-800/60 px-2 py-1.5 border border-dark-700/60">
          <p className="text-[10px] text-dark-500 mb-0.5">from</p>
          <p className="text-xs font-medium text-dark-100 truncate font-mono">
            {join.leftTable}
          </p>
          <p className="text-[10px] text-brand-400 truncate font-mono mt-0.5">
            .{join.leftColumn}
          </p>
        </div>

        {/* Arrow */}
        <div className="shrink-0 flex flex-col items-center gap-0.5">
          <svg width="28" height="16" viewBox="0 0 28 16">
            <line
              x1="2" y1="8" x2="22" y2="8"
              stroke={color.line}
              strokeWidth="1.5"
              strokeOpacity="0.7"
              strokeDasharray="3 2"
            />
            <polyline
              points="18,4 24,8 18,12"
              fill="none"
              stroke={color.line}
              strokeWidth="1.5"
              strokeOpacity="0.7"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[9px] text-dark-600">=</span>
        </div>

        {/* Right table */}
        <div className="flex-1 min-w-0 rounded bg-dark-800/60 px-2 py-1.5 border border-dark-700/60">
          <p className="text-[10px] text-dark-500 mb-0.5">join</p>
          <p className="text-xs font-medium text-dark-100 truncate font-mono">
            {join.rightTable}
          </p>
          <p className="text-[10px] text-blue-400 truncate font-mono mt-0.5">
            .{join.rightColumn}
          </p>
        </div>
      </div>

      {/* Alias badge */}
      {join.alias && (
        <p className="text-[10px] text-dark-500">
          alias:{" "}
          <span className="font-mono text-dark-400">{join.alias}</span>
        </p>
      )}
    </div>
  );
}

// ── Flow diagram — chain of tables connected by joins ────────────────────

function FlowDiagram({ parsed }: { parsed: ParsedQuery }) {
  // Build node list: FROM table first, then each joined table
  const nodes = useMemo(() => {
    return [
      { name: parsed.fromTable, role: "FROM" as const },
      ...parsed.joins.map((j) => ({
        name: j.table,
        role: j.type as string,
      })),
    ];
  }, [parsed]);

  if (nodes.length < 2) return null;

  return (
    <div className="rounded-lg border border-dark-700 bg-dark-800/40 p-3">
      <p className="text-[10px] text-dark-500 font-medium uppercase tracking-wide mb-3">
        Table chain
      </p>
      <div className="flex items-center flex-wrap gap-0">
        {nodes.map((node, i) => {
          const join = parsed.joins[i - 1];
          const color = join ? (JOIN_COLORS[join.type] ?? JOIN_COLORS.INNER) : null;

          return (
            <div key={node.name} className="flex items-center">
              {/* Connector between nodes */}
              {i > 0 && join && (
                <div className="flex flex-col items-center mx-1">
                  <svg width="32" height="20" viewBox="0 0 32 20">
                    <line
                      x1="2" y1="10" x2="28" y2="10"
                      stroke={color!.line}
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                      strokeOpacity="0.7"
                    />
                    <polyline
                      points="22,6 28,10 22,14"
                      fill="none"
                      stroke={color!.line}
                      strokeWidth="1.5"
                      strokeOpacity="0.7"
                    />
                  </svg>
                  <span className={cn("text-[9px] font-bold -mt-1", color!.text)}>
                    {join.type}
                  </span>
                </div>
              )}

              {/* Table node */}
              <div className={cn(
                "rounded-lg border px-2.5 py-1.5 text-center min-w-[64px]",
                i === 0
                  ? "border-brand-500/40 bg-brand-500/10"
                  : (color?.border ?? "border-dark-600") + " " + (color?.bg ?? "bg-dark-800")
              )}>
                <p className={cn(
                  "text-[9px] font-medium mb-0.5",
                  i === 0 ? "text-brand-400" : (color?.text ?? "text-dark-400")
                )}>
                  {i === 0 ? "FROM" : join?.type}
                </p>
                <p className="text-xs font-mono text-dark-100 font-semibold leading-tight">
                  {node.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function QueryJoinFlow({ parsed }: QueryJoinFlowProps) {
  if (!parsed.isValid) return null;

  // No joins — show simple FROM-only state
  if (parsed.joins.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 p-4 text-center">
          <p className="text-xs text-dark-400 mb-1">Single table query</p>
          <p className="text-sm font-mono font-semibold text-brand-300">
            {parsed.fromTable}
          </p>
          <p className="text-[10px] text-dark-600 mt-2">
            No JOINs detected in this query
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Chain diagram at top */}
      <FlowDiagram parsed={parsed} />

      {/* Individual join cards */}
      <div className="space-y-2">
        <p className="text-[10px] text-dark-500 font-medium uppercase tracking-wide">
          Join details
        </p>
        {parsed.joins.map((join, i) => (
          <JoinCard key={i} join={join} index={i} />
        ))}
      </div>

      {/* Join type legend */}
      <div className="rounded-lg border border-dark-700 bg-dark-800/30 p-3">
        <p className="text-[10px] text-dark-500 font-medium uppercase tracking-wide mb-2">
          Legend
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(JOIN_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <JoinVenn type={type} />
              <span className={cn("text-[10px] font-medium", color.text)}>
                {type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}