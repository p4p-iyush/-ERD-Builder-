"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../lib/utils/cn";

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail]       = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10
                          border border-green-500/30 flex items-center
                          justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div>
          <p className="text-dark-50 font-semibold text-lg">Check your email</p>
          <p className="text-dark-400 text-sm mt-1">
            We sent a reset link to{" "}
            <span className="text-brand-400 font-medium">{email}</span>
          </p>
        </div>
        <p className="text-dark-500 text-xs">
          Didn't receive it? Check your spam folder or{" "}
          <button
            onClick={() => setSent(false)}
            className="text-brand-400 hover:text-brand-300 transition-colors"
          >
            try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg",
          "bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
        )}>
          <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center
                           justify-center text-xs font-bold shrink-0">!</span>
          {error}
        </div>
      )}

      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail className="w-4 h-4" />}
        autoComplete="email"
        required
      />

      <Button
        type="submit"
        size="lg"
        isLoading={isLoading}
        className="w-full"
        leftIcon={<ArrowRight className="w-4 h-4" />}
      >
        Send reset link
      </Button>
    </form>
  );
}