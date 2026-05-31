import { Metadata } from "next";
import { Database, Sparkles } from "lucide-react";
import { SignupForm } from "../../../components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account — ERD Builder",
};

const STATS = [
  { value: "10+",  label: "Table templates" },
  { value: "SQL",  label: "Live preview"    },
  { value: "Free", label: "To get started"  },
];

export default function SignupPage() {
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

        <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full
                        bg-brand-600/10 blur-3xl pointer-events-none" />

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
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5
                              rounded-full bg-brand-600/10 border
                              border-brand-500/20 text-brand-400 text-xs
                              font-medium">
                <Sparkles className="w-3 h-3" />
                Free forever plan available
              </div>
              <h1 className="text-4xl font-bold text-dark-50 leading-tight">
                Start building
                <br />
                <span className="text-brand-400">your schema.</span>
              </h1>
              <p className="text-dark-400 text-lg leading-relaxed">
                Join developers who design cleaner databases
                faster with ERD Builder.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {STATS.map((stat) => (
                <div key={stat.label}
                     className="bg-dark-800/50 border border-dark-700/50
                                rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-brand-400">
                    {stat.value}
                  </div>
                  <div className="text-xs text-dark-400 mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

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
              Create your account
            </h2>
            <p className="text-dark-400 text-sm mt-1">
              Free to start. No credit card required.
            </p>
          </div>

          <SignupForm />
        </div>
      </div>
    </main>
  );
}