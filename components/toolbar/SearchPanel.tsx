"use client";

import { useEffect, useRef } from "react";
import { Search, X, Table2 } from "lucide-react";
import { useUIStore } from "../../store";
import { useSearch } from "../../hooks/useSearch";
import { cn } from "../../lib/utils/cn";

export function SearchPanel() {
  const { isSearchOpen, searchQuery, setSearchOpen, setSearchQuery } =
    useUIStore();
  const { results, focusNode } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-40
                 w-80 animate-slide-down"
    >
      {/* Search input */}
      <div
        className="flex items-center gap-2 px-3 py-2.5
                   bg-dark-800/95 backdrop-blur-md border border-dark-700
                   rounded-xl shadow-dark-lg"
      >
        <Search className="w-4 h-4 text-dark-400 shrink-0" />
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tables…"
          className="flex-1 bg-transparent text-dark-100 text-sm
                     placeholder-dark-500 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setSearchOpen(false);
              setSearchQuery("");
            }
            // Focus first result on Enter
            if (e.key === "Enter" && results.length > 0) {
              focusNode(results[0].id);
            }
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-dark-500 hover:text-dark-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
          className="text-dark-500 hover:text-dark-300 transition-colors
                     text-xs border border-dark-700 rounded px-1 py-0.5"
        >
          Esc
        </button>
      </div>

      {/* Results dropdown */}
      {searchQuery && (
        <div
          className="mt-1.5 bg-dark-800/95 backdrop-blur-md border
                     border-dark-700 rounded-xl shadow-dark-lg overflow-hidden
                     max-h-60 overflow-y-auto"
        >
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-dark-500 text-center">
              No tables found
            </div>
          ) : (
            results.map((node) => (
              <button
                key={node.id}
                onClick={() => {
                  focusNode(node.id);
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5
                           text-sm text-dark-300 hover:text-dark-100
                           hover:bg-dark-700 transition-colors text-left"
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center
                             justify-center shrink-0"
                  style={{
                    backgroundColor: `${node.data.color ?? "#6270f1"}20`,
                    border: `1px solid ${node.data.color ?? "#6270f1"}40`,
                  }}
                >
                  <Table2
                    className="w-3.5 h-3.5"
                    style={{ color: node.data.color ?? "#6270f1" }}
                  />
                </div>
                <span className="flex-1 truncate font-medium">
                  {node.data.tableName}
                </span>
                <span className="text-xs text-dark-600 shrink-0">
                  {node.data.columns.length} cols
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}