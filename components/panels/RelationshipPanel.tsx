"use client";

import { useState, useEffect } from "react";
import { X, GitBranch, ArrowRight } from "lucide-react";
import { useDiagramStore, useUIStore, useHistoryStore } from "../../store";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../lib/utils/cn";
import { RELATIONSHIP_OPTIONS } from "../../lib/constants/relationshipTypes";
import type { RelationshipType } from "../../types/relationship";

const REL_COLORS: Record<RelationshipType, string> = {
  "one-to-one":   "#6270f1",
  "one-to-many":  "#10b981",
  "many-to-many": "#f59e0b",
};

export function RelationshipPanel() {
  const { edges, nodes, updateRelationship, deleteRelationship } =
    useDiagramStore();
  const { activePanel, activePanelNodeId, closePanel } = useUIStore();
  const { pushSnapshot } = useHistoryStore();

  // activePanelNodeId doubles as edgeId for relationships
  const edge = edges.find((e) => e.id === activePanelNodeId);

  const [label, setLabel]   = useState(edge?.data?.label ?? "");
  const [relType, setRelType] = useState<RelationshipType>(
    edge?.data?.relationshipType ?? "one-to-many"
  );

  useEffect(() => {
    if (edge) {
      setLabel(edge.data?.label ?? "");
      setRelType(edge.data?.relationshipType ?? "one-to-many");
    }
  }, [edge?.id]);

  const isOpen = activePanel === "relationship";
  if (!isOpen || !edge) return null;

  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);
  const color      = REL_COLORS[relType];

  const commitLabel = () => {
    pushSnapshot();
    updateRelationship(edge.id, { label });
  };

  const handleTypeChange = (type: RelationshipType) => {
    setRelType(type);
    pushSnapshot();
    updateRelationship(edge.id, { relationshipType: type });
  };

  const handleDelete = () => {
    pushSnapshot();
    deleteRelationship(edge.id);
    closePanel();
  };

  return (
    <div
      className="absolute right-4 top-16 bottom-20 z-20
                 w-72 flex flex-col animate-slide-up"
    >
      <div
        className="flex flex-col bg-dark-800/95 backdrop-blur-md
                   border border-dark-700 rounded-2xl shadow-dark-lg
                   overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3
                     border-b border-dark-700"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <GitBranch
                className="w-3.5 h-3.5"
                style={{ color }}
              />
            </div>
            <span className="text-sm font-semibold text-dark-100">
              Relationship
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

        <div className="p-4 space-y-5">
          {/* Table connection preview */}
          <div
            className="flex items-center gap-2 p-3 rounded-xl
                       bg-dark-900/60 border border-dark-700"
          >
            <div
              className="flex-1 px-2 py-1.5 rounded-lg text-xs
                         font-medium text-center truncate"
              style={{
                backgroundColor: `${sourceNode?.data.color ?? "#6270f1"}15`,
                color:           sourceNode?.data.color ?? "#6270f1",
                border:          `1px solid ${sourceNode?.data.color ?? "#6270f1"}30`,
              }}
            >
              {sourceNode?.data.tableName ?? "Source"}
            </div>

            <ArrowRight
              className="w-4 h-4 shrink-0"
              style={{ color }}
            />

            <div
              className="flex-1 px-2 py-1.5 rounded-lg text-xs
                         font-medium text-center truncate"
              style={{
                backgroundColor: `${targetNode?.data.color ?? "#10b981"}15`,
                color:           targetNode?.data.color ?? "#10b981",
                border:          `1px solid ${targetNode?.data.color ?? "#10b981"}30`,
              }}
            >
              {targetNode?.data.tableName ?? "Target"}
            </div>
          </div>

          {/* Relationship type */}
          <div>
            <label className="text-xs font-medium text-dark-400 uppercase
                              tracking-wider block mb-2">
              Relationship Type
            </label>
            <div className="space-y-2">
              {RELATIONSHIP_OPTIONS.map((opt) => {
                const optColor = REL_COLORS[opt.value];
                const isSelected = relType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleTypeChange(opt.value)}
                    className={cn(
                      `w-full flex items-start gap-3 p-3 rounded-xl
                       border text-left transition-all duration-200`,
                      isSelected
                        ? "border-current bg-current/10"
                        : "border-dark-700 hover:border-dark-600 bg-dark-900/40"
                    )}
                    style={
                      isSelected
                        ? { borderColor: `${optColor}50`,
                            backgroundColor: `${optColor}10` }
                        : {}
                    }
                  >
                    {/* Symbol preview */}
                    <div
                      className="font-mono text-sm font-bold shrink-0
                                 w-14 text-center mt-0.5"
                      style={{ color: isSelected ? optColor : "#525252" }}
                    >
                      {opt.sourceSymbol} — {opt.targetSymbol}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-sm font-semibold",
                          isSelected ? "text-dark-50" : "text-dark-400"
                        )}
                      >
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-dark-500 mt-0.5
                                      leading-snug">
                        {opt.description}
                      </div>
                    </div>

                    {isSelected && (
                      <span
                        className="text-xs font-bold shrink-0 mt-0.5"
                        style={{ color: optColor }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label */}
          <Input
            label="Relationship label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => e.key === "Enter" && commitLabel()}
            placeholder="e.g. has many, belongs to"
            hint="Optional label shown on the edge"
          />

          {/* Delete */}
          <Button
            variant="danger"
            size="sm"
            className="w-full"
            onClick={handleDelete}
          >
            Delete Relationship
          </Button>
        </div>
      </div>
    </div>
  );
}