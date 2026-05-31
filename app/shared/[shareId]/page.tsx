import { notFound } from "next/navigation";
import { Database, Eye, Table2, GitBranch, Lock } from "lucide-react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import { SharedCanvas } from "../../../components/canvas/SharedCanvas";
import type { DiagramData } from "../../../types/diagram";

interface SharedPageProps {
  params: Promise<{ shareId: string }>;
}

export default async function SharedDiagramPage({ params }: SharedPageProps) {
  const { shareId } = await params;
  const supabase    = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("share_id", shareId)
    .eq("is_public", true)
    .single();

  if (error || !project) notFound();

  const diagram   = project.diagram as DiagramData;
  const nodeCount = diagram?.nodes?.length ?? 0;
  const edgeCount = diagram?.edges?.length ?? 0;
  const colCount  = diagram?.nodes?.reduce(
    (acc: number, n: DiagramData["nodes"][number]) =>
      acc + (n.data?.columns?.length ?? 0),
    0
  ) ?? 0;

  // Serialize diagram to pass to client component
  const diagramJSON = JSON.stringify(diagram);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Top bar */}
      <header className="h-12 bg-dark-900/90 backdrop-blur-md border-b
                         border-dark-800 flex items-center px-4 gap-3
                         sticky top-0 z-30 shrink-0">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center
                          justify-center shadow-glow-sm">
            <Database className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-dark-50 hidden sm:block">
            ERD Builder
          </span>
        </Link>

        <div className="w-px h-4 bg-dark-700 shrink-0" />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-dark-100 truncate">
            {project.project_name}
          </h1>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5
                           rounded text-[10px] font-medium border shrink-0
                           bg-dark-800 text-dark-500 border-dark-700">
            <Eye className="w-2.5 h-2.5" />
            Read-only
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-dark-500">
            <Table2 className="w-3.5 h-3.5 text-brand-400" />
            {nodeCount} table{nodeCount !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-dark-500">
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            {edgeCount} relationship{edgeCount !== 1 ? "s" : ""}
          </div>
        </div>

        <Link
          href="/signup"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5
                     rounded-lg bg-brand-600 hover:bg-brand-500 text-white
                     text-xs font-medium transition-all duration-200
                     shadow-glow-sm hover:shadow-glow"
        >
          Create your own →
        </Link>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 84px)" }}>
        {nodeCount === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center
                          justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-dark-800 border
                            border-dark-700 flex items-center justify-center
                            text-3xl">
              🗄️
            </div>
            <div className="text-center">
              <h2 className="text-base font-semibold text-dark-200">
                Empty diagram
              </h2>
              <p className="text-sm text-dark-500 mt-1">
                This diagram has no tables yet
              </p>
            </div>
          </div>
        ) : (
          <SharedCanvas diagramJSON={diagramJSON} />
        )}
      </div>

      {/* Bottom bar */}
      <div className="h-9 bg-dark-900/80 backdrop-blur-md border-t
                      border-dark-800 flex items-center justify-between
                      px-4 shrink-0">
        <div className="flex items-center gap-2 text-xs text-dark-600">
          <Lock className="w-3 h-3" />
          Shared read-only view · Created with ERD Builder
        </div>
        <div className="flex items-center gap-3 text-xs text-dark-600">
          <span>{colCount} total columns</span>
          <span>·</span>
          <span>
            Updated{" "}
            {new Date(project.updated_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const supabase    = await createClient();

  const { data } = await supabase
    .from("projects")
    .select("project_name")
    .eq("share_id", shareId)
    .eq("is_public", true)
    .single();

  return {
    title: data
      ? `${data.project_name} — ERD Builder`
      : "Shared Diagram — ERD Builder",
    description: "View a shared ERD diagram",
  };
}