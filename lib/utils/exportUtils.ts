import { toPng, toSvg } from "html-to-image";
import type { TableNode, RelationshipEdge, DiagramData } from "../../types/diagram";

// ── PNG Export ────────────────────────────────────────────────────────────
export async function exportToPNG(
  element: HTMLElement,
  filename = "erd-diagram"
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: "#0a0a0a",
      pixelRatio: 2,
      quality: 1,
      filter: (node) => {
        // Exclude toolbar and controls from export
        if (node.classList?.contains("react-flow__controls")) return false;
        if (node.classList?.contains("react-flow__minimap"))  return false;
        if (node.classList?.contains("floating-toolbar"))     return false;
        return true;
      },
    });
    downloadFile(dataUrl, `${filename}.png`);
  } catch (error) {
    console.error("PNG export failed:", error);
    throw error;
  }
}

// ── SVG Export ────────────────────────────────────────────────────────────
export async function exportToSVG(
  element: HTMLElement,
  filename = "erd-diagram"
): Promise<void> {
  try {
    const dataUrl = await toSvg(element, {
      backgroundColor: "#0a0a0a",
      filter: (node) => {
        if (node.classList?.contains("react-flow__controls")) return false;
        if (node.classList?.contains("react-flow__minimap"))  return false;
        return true;
      },
    });
    downloadFile(dataUrl, `${filename}.svg`);
  } catch (error) {
    console.error("SVG export failed:", error);
    throw error;
  }
}

// ── JSON Export ───────────────────────────────────────────────────────────
export function exportToJSON(
  nodes: TableNode[],
  edges: RelationshipEdge[],
  projectName = "erd-diagram"
): void {
  const diagram: DiagramData & {
    meta: { exportedAt: string; version: string; tableCount: number };
  } = {
    nodes,
    edges,
    meta: {
      exportedAt: new Date().toISOString(),
      version:    "1.0.0",
      tableCount: nodes.length,
    },
  };

  const json    = JSON.stringify(diagram, null, 2);
  const blob    = new Blob([json], { type: "application/json" });
  const dataUrl = URL.createObjectURL(blob);
  downloadFile(dataUrl, `${projectName}.json`);
  URL.revokeObjectURL(dataUrl);
}

// ── SQL Export ────────────────────────────────────────────────────────────
export function exportToSQL(sql: string, filename = "schema"): void {
  const blob    = new Blob([sql], { type: "text/plain" });
  const dataUrl = URL.createObjectURL(blob);
  downloadFile(dataUrl, `${filename}.sql`);
  URL.revokeObjectURL(dataUrl);
}

// ── Helper ────────────────────────────────────────────────────────────────
function downloadFile(dataUrl: string, filename: string): void {
  const link    = document.createElement("a");
  link.href     = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ── Clipboard ─────────────────────────────────────────────────────────────
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const ta        = document.createElement("textarea");
    ta.value        = text;
    ta.style.position = "fixed";
    ta.style.opacity  = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}