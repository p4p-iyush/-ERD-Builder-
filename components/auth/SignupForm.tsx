"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, UserPlus, CheckCircle2 } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../lib/utils/cn";

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const PASSWORD_RULES = [
  { label: "At least 8 characters",  test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter",   test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number",             test: (p: string) => /\d/.test(p) },
];

export function SignupForm() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors]         = useState<FormErrors>({});
  const [isLoading, setIsLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [emailSent, setEmailSent]       = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setErrors({ general: "This email is already registered. Try signing in." });
        } else {
          setErrors({ general: error.message });
        }
        return;
      }

      setEmailSent(true);
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Email sent confirmation screen ──────────────────────────────────────
  if (emailSent) {
    return (
      <div className="text-center space-y-4 py-4 animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-brand-600/20 border
                        border-brand-500/30 flex items-center justify-center
                        mx-auto">
          <CheckCircle2 className="w-8 h-8 text-brand-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-dark-50">
            Check your inbox
          </h3>
          <p className="text-sm text-dark-400 mt-2 leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="text-brand-400 font-medium">{form.email}</span>.
            Click it to activate your account.
          </p>
        </div>
        <p className="text-xs text-dark-500">
          Already confirmed?{" "}
          <Link
            href="/login"
            className="text-brand-400 hover:text-brand-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* General error */}
      {errors.general && (
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg",
          "bg-red-500/10 border border-red-500/30 text-red-400 text-sm",
          "animate-slide-down"
        )}>
          <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center
                           justify-center text-xs font-bold shrink-0">
            !
          </span>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) =>
            setForm((f) => ({ ...f, email: e.target.value }))
          }
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          required
        />

        {/* Password */}
        <div className="space-y-2">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            error={errors.password}
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
                  : <Eye className="w-4 h-4" />
                }
              </button>
            }
            autoComplete="new-password"
            required
          />

          {/* Password strength indicators */}
          {form.password && (
            <div className="space-y-1 pl-1 animate-fade-in">
              {PASSWORD_RULES.map((rule) => {
                const passed = rule.test(form.password);
                return (
                  <div
                    key={rule.label}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-colors",
                      passed ? "text-emerald-400" : "text-dark-500"
                    )}
                  >
                    <span className={cn(
                      "w-3.5 h-3.5 rounded-full border flex items-center",
                      "justify-center transition-all text-[9px] font-bold",
                      passed
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                        : "bg-dark-700 border-dark-600"
                    )}>
                      {passed && "✓"}
                    </span>
                    {rule.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm password */}
        <Input
          label="Confirm password"
          type={showConfirm ? "text" : "password"}
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={(e) =>
            setForm((f) => ({ ...f, confirmPassword: e.target.value }))
          }
          error={errors.confirmPassword}
          leftIcon={<Lock className="w-4 h-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="text-dark-400 hover:text-dark-200 transition-colors"
              tabIndex={-1}
            >
              {showConfirm
                ? <EyeOff className="w-4 h-4" />
                : <Eye className="w-4 h-4" />
              }
            </button>
          }
          autoComplete="new-password"
          required
        />

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          className="w-full"
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Create account
        </Button>
      </form>

      {/* Terms */}
      <p className="text-center text-xs text-dark-500 leading-relaxed">
        By creating an account you agree to our{" "}
        <Link href="/terms"
              className="text-brand-400 hover:text-brand-300 transition-colors">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy"
              className="text-brand-400 hover:text-brand-300 transition-colors">
          Privacy Policy
        </Link>
      </p>

      {/* Sign in link */}
      <p className="text-center text-sm text-dark-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-brand-400 hover:text-brand-300 font-medium
                     transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}