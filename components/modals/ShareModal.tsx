"use client";

import { useState, useEffect } from "react";
import {
  Globe, Lock, Link, Check, Copy,
  Eye, EyeOff, ExternalLink,
} from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { useProjectStore, useUIStore } from "../../store";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils/cn";

export function ShareModal() {
  const supabase = createClient();
  const { activeModal, closeModal } = useUIStore();
  const { currentProject, setCurrentProject } = useProjectStore();

  const [isPublic, setIsPublic]     = useState(false);
  const [isSaving, setIsSaving]     = useState(false);
  const [copied, setCopied]         = useState(false);
  const [error, setError]           = useState("");

  // Sync from project
  useEffect(() => {
    if (currentProject) {
      setIsPublic(currentProject.is_public);
    }
  }, [currentProject?.is_public, activeModal]);

  const shareUrl = currentProject?.share_id
    ? `${process.env.NEXT_PUBLIC_APP_URL}/shared/${currentProject.share_id}`
    : "";

  const handleTogglePublic = async () => {
    if (!currentProject) return;
    setIsSaving(true);
    setError("");

    const next = !isPublic;

    try {
      const { data, error: dbError } = await supabase
        .from("projects")
        .update({ is_public: next })
        .eq("id", currentProject.id)
        .select()
        .single();

      if (dbError) throw dbError;

      setIsPublic(next);
      setCurrentProject({
        ...currentProject,
        is_public: next,
      });
    } catch (err) {
      setError("Failed to update sharing settings. Please try again.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={activeModal === "share"}
      onClose={closeModal}
      title="Share Diagram"
      description="Control who can view your ERD diagram"
      size="md"
    >
      <div className="space-y-5">
        {/* Public toggle card */}
        <div
          className={cn(
            `p-4 rounded-xl border transition-all duration-300`,
            isPublic
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-dark-700 bg-dark-900/50"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  `w-10 h-10 rounded-xl flex items-center justify-center
                   shrink-0 transition-all duration-300`,
                  isPublic
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-dark-800 text-dark-500"
                )}
              >
                {isPublic
                  ? <Globe className="w-5 h-5" />
                  : <Lock  className="w-5 h-5" />
                }
              </div>
              <div>
                <h3 className="text-sm font-semibold text-dark-100">
                  {isPublic ? "Public access" : "Private diagram"}
                </h3>
                <p className="text-xs text-dark-500 mt-0.5 leading-relaxed">
                  {isPublic
                    ? "Anyone with the link can view this diagram (read-only)"
                    : "Only you can access this diagram"
                  }
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              onClick={handleTogglePublic}
              disabled={isSaving}
              className={cn(
                `relative w-11 h-6 rounded-full transition-all duration-300
                 shrink-0 mt-1 focus:outline-none focus:ring-2
                 focus:ring-offset-2 focus:ring-offset-dark-800`,
                isPublic
                  ? "bg-emerald-500 focus:ring-emerald-500"
                  : "bg-dark-600 focus:ring-dark-500",
                isSaving && "opacity-50 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  `absolute top-0.5 w-5 h-5 rounded-full bg-white
                   shadow-sm transition-all duration-300`,
                  isPublic ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg
                          bg-red-500/10 border border-red-500/20 text-sm
                          text-red-400">
            ⚠ {error}
          </div>
        )}

        {/* Share link section */}
        <div
          className={cn(
            "space-y-3 transition-all duration-300",
            !isPublic && "opacity-40 pointer-events-none"
          )}
        >
          <div className="flex items-center gap-2">
            <div className="w-px h-4 bg-dark-700" />
            <p className="text-xs text-dark-500 font-medium uppercase
                          tracking-wider">
              Share link
            </p>
          </div>

          {/* URL display */}
          <div
            className="flex items-center gap-2 p-3 rounded-xl
                       bg-dark-900/80 border border-dark-700"
          >
            <Link className="w-4 h-4 text-dark-500 shrink-0" />
            <span className="flex-1 text-xs font-mono text-dark-300 truncate">
              {shareUrl || "Enable public access to get a link"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={handleCopyLink}
              disabled={!shareUrl || !isPublic}
              leftIcon={
                copied
                  ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                  : <Copy  className="w-3.5 h-3.5" />
              }
            >
              {copied ? "Copied!" : "Copy link"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              disabled={!shareUrl || !isPublic}
              onClick={() => shareUrl && window.open(shareUrl, "_blank")}
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Preview
            </Button>
          </div>
        </div>

        {/* Info box */}
        <div
          className="flex items-start gap-3 px-3 py-3 rounded-xl
                     bg-dark-900/60 border border-dark-700"
        >
          <Eye className="w-4 h-4 text-dark-500 shrink-0 mt-0.5" />
          <div className="text-xs text-dark-500 leading-relaxed">
            Shared diagrams are <strong className="text-dark-400">read-only</strong>.
            Viewers can pan and zoom but cannot edit tables or relationships.
          </div>
        </div>

        {/* Close */}
        <div className="flex justify-end pt-1">
          <Button variant="ghost" onClick={closeModal}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}