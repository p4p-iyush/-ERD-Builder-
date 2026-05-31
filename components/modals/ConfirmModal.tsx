"use client";

import { AlertTriangle } from "lucide-react";
import { useUIStore } from "../../store";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";

export function ConfirmModal() {
  const { activeModal, confirmMessage, confirmAction, clearConfirm } =
    useUIStore();

  const handleConfirm = () => {
    confirmAction?.();
    clearConfirm();
  };

  return (
    <Modal
      isOpen={activeModal === "confirm"}
      onClose={clearConfirm}
      size="sm"
      showClose={false}
    >
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border
                        border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-dark-50">
            Are you sure?
          </h3>
          <p className="text-sm text-dark-400 mt-1">{confirmMessage}</p>
        </div>
        <div className="flex gap-3 w-full pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={clearConfirm}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1 bg-red-600/80 hover:bg-red-600 text-red-100
                       border-red-500/40"
            onClick={handleConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}