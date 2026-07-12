"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../lib/utils/cn";

export function ResetPasswordForm() {
  const router  = useRouter();
  const supabase = createClient();

  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [done, setDone]                 = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends the user to this page with a session already set
  // via the auth callback — we just need to confirm the session exists
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
      else setError("Invalid or expired reset link. Please request a new one.");
    });
  }, [supabase]);

  const validate = (): boolean => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────
  if (done) {
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
          <p className="text-dark-50 font-semibold text-lg">
            Password updated!
          </p>
          <p className="text-dark-400 text-sm mt-1">
            Redirecting you to your workspace…
          </p>
        </div>
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
        label="New password"
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock className="w-4 h-4" />}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-dark-400 hover:text-dark-200 transition-colors"
            tabIndex={-1}
          >
            {showPassword
              ? <EyeOff className="w-4 h-4" />
              : <Eye className="w-4 h-4" />}
          </button>
        }
        autoComplete="new-password"
        required
      />

      <Input
        label="Confirm new password"
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        leftIcon={<Lock className="w-4 h-4" />}
        autoComplete="new-password"
        required
      />

      <Button
        type="submit"
        size="lg"
        isLoading={isLoading}
        disabled={!sessionReady}
        className="w-full"
      >
        Update password
      </Button>
    </form>
  );
}