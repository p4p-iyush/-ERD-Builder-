"use client";

import { memo } from "react";
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from "@xyflow/react";
import { cn } from "../../lib/utils/cn";
import type { RelationshipData } from "../../types/diagram";
import type { RelationshipEdge as RelationshipEdgeType } from "../../types/diagram";

type Props = EdgeProps<RelationshipEdgeType>;

function getRelationshipColor(
  type: RelationshipData["relationshipType"],
  isHighlighted: boolean
): string {
  if (!isHighlighted) return "#404040";
  switch (type) {
    case "one-to-one":   return "#6270f1";
    case "one-to-many":  return "#10b981";
    case "many-to-many": return "#f59e0b";
    default:             return "#6270f1";
  }
}

function RelationshipSymbol({
  type,
  side,
  color,
}: {
  type: RelationshipData["relationshipType"];
  side: "source" | "target";
  color: string;
}) {
  const isMany =
    (side === "source" && type === "many-to-many") ||
    (side === "target" &&
      (type === "one-to-many" || type === "many-to-many"));

  return (
    <span
      className="text-[10px] font-bold font-mono"
      style={{ color }}
    >
      {isMany ? "∞" : "1"}
    </span>
  );
}

export const RelationshipEdge = memo(function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: Props) {
  const relationshipType = data?.relationshipType ?? "one-to-many";
  const label            = data?.label ?? "";
  const isHighlighted    = data?.isHighlighted ?? false;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const color = getRelationshipColor(relationshipType, isHighlighted || !!selected);

  const strokeWidth = selected ? 2.5 : isHighlighted ? 2 : 1.5;

  return (
    <>
      {/* Invisible wider hit area */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
      />

      {/* Visible edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth,
          strokeDasharray: relationshipType === "many-to-many"
            ? "6 3"
            : undefined,
          transition: "stroke 0.3s ease, stroke-width 0.2s ease",
        }}
      />

      {/* Label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position:  "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {/* Relationship type symbols */}
          <div
            className={cn(
              `flex items-center gap-1.5 px-2 py-0.5 rounded-full
               border text-[10px] font-medium transition-all duration-300`,
              isHighlighted || selected
                ? "opacity-100 bg-dark-800 border-dark-600"
                : "opacity-0 group-hover:opacity-100 bg-dark-900/80 border-dark-700"
            )}
            style={{ borderColor: `${color}50` }}
          >
            <RelationshipSymbol
              type={relationshipType}
              side="source"
              color={color}
            />
            {label && (
              <span className="text-dark-400 font-normal">{label}</span>
            )}
            <RelationshipSymbol
              type={relationshipType}
              side="target"
              color={color}
            />
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});