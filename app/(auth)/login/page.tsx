import { Metadata } from "next";
import Link from "next/link";
import { Database } from "lucide-react";
import { LoginForm } from "../../../components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — ERD Builder",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-dark-950 flex">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden
                      bg-gradient-to-br from-dark-900 via-dark-900
                      to-brand-950/30">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(#6270f1 1px, transparent 1px),
              linear-gradient(90deg, #6270f1 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full
                        bg-brand-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full
                        bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center
                            justify-center shadow-glow">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-dark-50 tracking-tight">
              ERD Builder
            </span>
          </div>

          {/* Main copy */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-dark-50 leading-tight">
                Design databases
                <br />
                <span className="text-brand-400">visually.</span>
              </h1>
              <p className="text-dark-400 text-lg leading-relaxed">
                Create, visualize, and export your database schema
                with an intuitive drag-and-drop interface.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                "Drag-and-drop table builder",
                "Live SQL preview & export",
                "Share diagrams with your team",
                "Starter templates included",
              ].map((feature) => (
                <div key={feature}
                     className="flex items-center gap-3 text-dark-300">
                  <span className="w-5 h-5 rounded-full bg-brand-600/20
                                   border border-brand-500/30 flex items-center
                                   justify-center text-[10px] text-brand-400
                                   font-bold shrink-0">
                    ✓
                  </span>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-dark-600 text-xs">
            © {new Date().getFullYear()} ERD Builder. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right — Auth form */}
      <div className="flex-1 flex flex-col justify-center items-center
                      px-6 py-12 lg:px-16">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center
                          justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-dark-50">ERD Builder</span>
        </div>

        <div className="w-full max-w-[380px]">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-dark-50">
              Welcome back
            </h2>
            <p className="text-dark-400 text-sm mt-1">
              Sign in to continue to your workspace
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}