"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function sendMagicLink(email: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Derive the site origin from request headers so this works in
  // both local dev (http://localhost:3000) and production (https://…).
  const headersList = await headers();
  const host  = headersList.get("host")!;
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // Only allow pre-existing users — employees must be created by an admin first.
      // If the email isn't in auth.users, Supabase returns success anyway (prevents
      // user enumeration), but no email is actually sent.
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

/**
 * DEV ONLY — bypasses email entirely. Uses the admin API to generate a
 * magic link, then immediately verifies the OTP code server-side so the
 * session cookies are written right here in the action. Never runs in prod.
 *
 * Why not token_hash + callback redirect: @supabase/ssr uses flowType:'pkce'
 * which requires a code_verifier cookie that only exists for user-initiated
 * flows — not admin-generated links. verifyOtp({ email, token }) hits the
 * verify endpoint directly and is unaffected by PKCE.
 */
export async function devSignIn(email: string): Promise<{ error?: string }> {
  if (process.env.NODE_ENV !== "development") {
    return { error: "Only available in development." };
  }

  const admin = createAdminClient();
  const { data, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !data?.properties?.email_otp) {
    return { error: linkError?.message ?? "Failed to generate OTP." };
  }

  // Verify the OTP directly — this writes session cookies via the SSR client.
  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: data.properties.email_otp,
    type: "magiclink",
  });

  if (verifyError) {
    return { error: verifyError.message };
  }

  redirect("/dashboard");
}
