"use client";

import { useState } from "react";
import {
  Image, FileCode2, FileJson, FileText,
  Download, Check, Loader2,
} from "lucide-react";
import { useUIStore } from "../../store";
import { useExport, type ExportFormat } from "../../hooks/useExport";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils/cn";

interface FormatOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  ext: string;
  color: string;
  badge?: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id:          "png",
    label:       "PNG Image",
    description: "High-resolution raster image of your diagram",
    icon:        <Image className="w-5 h-5" />,
    ext:         ".png",
    color:       "#6270f1",
    badge:       "2x",
  },
  {
    id:          "svg",
    label:       "SVG Vector",
    description: "Scalable vector image, perfect for presentations",
    icon:        <FileCode2 className="w-5 h-5" />,
    ext:         ".svg",
    color:       "#10b981",
  },
  {
    id:          "json",
    label:       "JSON Diagram",
    description: "Machine-readable format to import back later",
    icon:        <FileJson className="w-5 h-5" />,
    ext:         ".json",
    color:       "#f59e0b",
  },
  {
    id:          "sql",
    label:       "SQL Schema",
    description: "PostgreSQL CREATE TABLE statements",
    icon:        <FileText className="w-5 h-5" />,
    ext:         ".sql",
    color:       "#ec4899",
    badge:       "PG",
  },
];

export function ExportModal() {
  const { activeModal, closeModal }       = useUIStore();
  const { doExport, isExporting, error }  = useExport();
  const [selected, setSelected]           = useState<ExportFormat>("png");
  const [exported, setExported]           = useState<ExportFormat | null>(null);

  const handleExport = async () => {
    await doExport(selected);
    if (!error) {
      setExported(selected);
      setTimeout(() => setExported(null), 2500);
    }
  };

  return (
    <Modal
      isOpen={activeModal === "export"}
      onClose={closeModal}
      title="Export Diagram"
      description="Choose a format to download your ERD"
      size="md"
    >
      <div className="space-y-5">
        {/* Format grid */}
        <div className="grid grid-cols-2 gap-3">
          {FORMAT_OPTIONS.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setSelected(fmt.id)}
              className={cn(
                `relative p-4 rounded-xl border text-left
                 transition-all duration-200`,
                selected === fmt.id
                  ? "border-brand-500 bg-brand-600/10"
                  : "border-dark-700 hover:border-dark-600 bg-dark-900/50"
              )}
            >
              {/* Badge */}
              {fmt.badge && (
                <span
                  className="absolute top-2 right-2 text-[9px] font-bold
                             px-1 py-0.5 rounded border"
                  style={{
                    color:            fmt.color,
                    borderColor:      `${fmt.color}40`,
                    backgroundColor:  `${fmt.color}15`,
                  }}
                >
                  {fmt.badge}
                </span>
              )}

              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center
                           justify-center mb-3"
                style={{
                  backgroundColor: `${fmt.color}15`,
                  color:           fmt.color,
                }}
              >
                {fmt.icon}
              </div>

              {/* Label */}
              <div className="text-sm font-semibold text-dark-100">
                {fmt.label}
              </div>
              <div className="text-[11px] text-dark-500 mt-0.5 leading-snug">
                {fmt.description}
              </div>

              {/* Extension */}
              <div
                className="mt-2 text-[10px] font-mono font-medium"
                style={{ color: fmt.color }}
              >
                {fmt.ext}
              </div>

              {/* Selection indicator */}
              {selected === fmt.id && (
                <div
                  className="absolute top-2 left-2 w-4 h-4 rounded-full
                             bg-brand-600 flex items-center justify-center"
                >
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg
                          bg-red-500/10 border border-red-500/20 text-sm
                          text-red-400">
            <span className="shrink-0">⚠</span>
            {error}
          </div>
        )}

        {/* Notes per format */}
        <div
          className="px-3 py-2.5 rounded-lg bg-dark-900/60 border
                     border-dark-700 text-xs text-dark-500"
        >
          {selected === "png" && (
            "Exports at 2× resolution for crisp results. " +
            "Controls and minimap are excluded."
          )}
          {selected === "svg" && (
            "Exports as a scalable vector — infinite zoom without blur."
          )}
          {selected === "json" && (
            "Exports the full diagram state including positions " +
            "and styling. Can be re-imported later."
          )}
          {selected === "sql" && (
            "Generates PostgreSQL-compatible CREATE TABLE statements " +
            "with foreign keys and indexes."
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={closeModal} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            isLoading={isExporting}
            leftIcon={
              exported === selected
                ? <Check className="w-4 h-4" />
                : <Download className="w-4 h-4" />
            }
            className={cn(
              exported === selected &&
              "bg-emerald-600 hover:bg-emerald-500"
            )}
          >
            {exported === selected
              ? "Downloaded!"
              : isExporting
              ? "Exporting…"
              : `Export ${FORMAT_OPTIONS.find((f) => f.id === selected)?.ext}`
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
}