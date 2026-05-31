"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Loader2 } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { useProjectStore } from "../../store";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { TEMPLATES } from "../../lib/utils/templateData";
import { cn } from "../../lib/utils/cn";
import type { DiagramData } from "../../types/diagram";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const router     = useRouter();
  const supabase   = createClient();
  const { addToRecent } = useProjectStore();

  const [name, setName]             = useState("Untitled Project");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState("");

  const handleCreate = async () => {
    if (!name.trim()) { setError("Project name is required"); return; }

    setIsLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let diagram: DiagramData = { nodes: [], edges: [] };
      if (selectedTemplate) {
        const tmpl = TEMPLATES.find((t) => t.id === selectedTemplate);
        if (tmpl) diagram = tmpl.getDiagram();
      }

      const { data, error: dbError } = await supabase
        .from("projects")
        .insert({
          user_id:      user.id,
          project_name: name.trim(),
          diagram:      diagram as unknown as Record<string, unknown>,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      addToRecent(data.id);
      onClose();
      router.push(`/editor/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Project"
      description="Start from scratch or pick a starter template"
      size="lg"
    >
      <div className="space-y-6">
        {/* Project name */}
        <Input
          label="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          placeholder="My Database Schema"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />

        {/* Templates */}
        <div>
          <p className="text-sm font-medium text-dark-200 mb-3">
            Starter template{" "}
            <span className="text-dark-500 font-normal">(optional)</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Blank option */}
            <button
              onClick={() => setSelectedTemplate(null)}
              className={cn(
                `p-3 rounded-xl border text-left transition-all duration-200`,
                selectedTemplate === null
                  ? "border-brand-500 bg-brand-600/10"
                  : "border-dark-700 hover:border-dark-600 bg-dark-900/50"
              )}
            >
              <div className="text-xl mb-1">⬜</div>
              <div className="text-sm font-medium text-dark-100">Blank</div>
              <div className="text-xs text-dark-500 mt-0.5">
                Start from scratch
              </div>
            </button>

            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={cn(
                  `p-3 rounded-xl border text-left transition-all duration-200`,
                  selectedTemplate === t.id
                    ? "border-brand-500 bg-brand-600/10"
                    : "border-dark-700 hover:border-dark-600 bg-dark-900/50"
                )}
              >
                <div className="text-xl mb-1">{t.icon}</div>
                <div className="text-sm font-medium text-dark-100">{t.name}</div>
                <div className="text-xs text-dark-500 mt-0.5">
                  {t.tableCount} tables
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            isLoading={isLoading}
            leftIcon={<FolderPlus className="w-4 h-4" />}
          >
            Create Project
          </Button>
        </div>
      </div>
    </Modal>
  );
}