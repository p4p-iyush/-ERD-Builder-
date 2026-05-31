import Link from "next/link";
import { Database, ArrowLeft } from "lucide-react";

export default function SharedNotFound() {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      <header
        className="h-12 bg-dark-900/90 backdrop-blur-md border-b
                   border-dark-800 flex items-center px-4"
      >
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md bg-brand-600 flex items-center
                       justify-center"
          >
            <Database className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-dark-50">ERD Builder</span>
        </Link>
      </header>

      {/* Body */}
      <div
        className="flex-1 flex flex-col items-center justify-center
                   gap-6 px-4"
      >
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-2xl bg-dark-800 border
                     border-dark-700 flex items-center justify-center
                     text-4xl"
        >
          🔒
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-dark-50">
            Diagram not found
          </h1>
          <p className="text-dark-400 text-sm max-w-sm leading-relaxed">
            This diagram doesn&apos;t exist, has been made private,
            or the link may have expired.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5
                       rounded-xl bg-brand-600 hover:bg-brand-500
                       text-white text-sm font-medium transition-all
                       duration-200 shadow-glow-sm"
          >
            <Database className="w-4 h-4" />
            Go to ERD Builder
          </Link>
          <Link
            href="javascript:history.back()"
            className="inline-flex items-center gap-2 px-4 py-2.5
                       rounded-xl bg-dark-800 border border-dark-700
                       hover:border-dark-600 text-dark-300 text-sm
                       font-medium transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </Link>
        </div>
      </div>
    </div>
  );
}