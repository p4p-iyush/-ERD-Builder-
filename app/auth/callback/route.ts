import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code       = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type       = searchParams.get("type");
  const next       = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  // ── Password reset flow (token_hash) ──────────────────────────────────
  if (token_hash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: "recovery",
    });
    if (!error) {
      return NextResponse.redirect(`${origin}/reset-password`);
    }
  }

  // ── Magic link / OAuth flow (code) ────────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // ── Error fallback ────────────────────────────────────────────────────
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}