"use client";

import { useCallback, useState } from "react";
import { useDiagramStore, useProjectStore } from "../store";
import { generateSQL } from "../lib/utils/sqlGenerator";
import { toast } from "../components/ui/Toast";
import {
  exportToPNG,
  exportToSVG,
  exportToJSON,
  exportToSQL,
} from "../lib/utils/exportUtils";

export type ExportFormat = "png" | "svg" | "json" | "sql";

export function useExport() {
  const { nodes, edges } = useDiagramStore();
  const { currentProject } = useProjectStore();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectName = currentProject?.project_name ?? "erd-diagram";

  const doExport = useCallback(
    async (format: ExportFormat) => {
      setIsExporting(true);
      setError(null);

      try {
        switch (format) {
          case "png": {
            const el = document.querySelector(
              ".react-flow__renderer",
            ) as HTMLElement | null;
            if (!el) throw new Error("Canvas element not found");
            await exportToPNG(el, projectName);
            toast.success(
              "PNG exported",
              "Your diagram image has been downloaded.",
            );
            break;
          }
          case "svg": {
            const el = document.querySelector(
              ".react-flow__renderer",
            ) as HTMLElement | null;
            if (!el) throw new Error("Canvas element not found");
            await exportToSVG(el, projectName);
            toast.success(
              "SVG exported",
              "Your vector file has been downloaded.",
            );
            break;
          }
          case "json":
            exportToJSON(nodes, edges, projectName);
            toast.success("JSON exported", "Diagram data has been downloaded.");
            break;
          case "sql": {
            const sql = generateSQL(nodes, edges);
            exportToSQL(sql, projectName);
            toast.success("SQL exported", "Schema file has been downloaded.");
            break;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Export failed";
        setError(msg);
        toast.error("Export failed", msg);
      } finally {
        setIsExporting(false);
      }
    },
    [nodes, edges, projectName],
  );

  return { doExport, isExporting, error };
}
