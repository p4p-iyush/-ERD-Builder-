"use client";

import { Keyboard } from "lucide-react";
import { useUIStore } from "../../store";
import { Modal } from "../../components/ui/Modal";
import { SHORTCUTS } from "../../lib/constants/shortcuts";
import { cn } from "../../lib/utils/cn";

const CATEGORIES = [
  { id: "general", label: "General" },
  { id: "edit",    label: "Editing" },
  { id: "view",    label: "View"    },
  { id: "table",   label: "Tables"  },
] as const;

function KeyBadge({ keys }: { keys: string }) {
  const parts = keys.split("+");
  return (
    <div className="flex items-center gap-1">
      {parts.map((part, i) => (
        <span key={i}>
          <kbd
            className="inline-flex items-center justify-center px-1.5 py-0.5
                       bg-dark-900 border border-dark-600 rounded text-[10px]
                       font-mono text-dark-300 min-w-[24px] text-center"
          >
            {part}
          </kbd>
          {i < parts.length - 1 && (
            <span className="text-dark-600 text-xs">+</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function ShortcutsModal() {
  const { activeModal, closeModal } = useUIStore();

  return (
    <Modal
      isOpen={activeModal === "shortcuts"}
      onClose={closeModal}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <div className="space-y-6">
        {CATEGORIES.map((cat) => {
          const catShortcuts = SHORTCUTS.filter(
            (s) => s.category === cat.id
          );
          return (
            <div key={cat.id}>
              <h3 className="text-xs font-semibold text-dark-500 uppercase
                             tracking-wider mb-3">
                {cat.label}
              </h3>
              <div className="space-y-1">
                {catShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex items-center justify-between py-1.5
                               px-2 rounded-lg hover:bg-dark-700/50
                               transition-colors group"
                  >
                    <div>
                      <span className="text-sm text-dark-200 font-medium">
                        {shortcut.label}
                      </span>
                      <span className="text-xs text-dark-500 ml-2">
                        {shortcut.description}
                      </span>
                    </div>
                    <KeyBadge keys={shortcut.keys} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}