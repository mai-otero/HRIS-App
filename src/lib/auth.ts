/**
 * Server-side auth utilities.
 * Only import this in Server Components, Route Handlers, or Server Actions.
 * Never import in Client Components.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Returns the full profile row for the currently signed-in user,
 * or null if not authenticated or no profile row exists.
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return data as Profile;
}

/**
 * Like getProfile() but redirects to /login if not authenticated.
 * Use in page.tsx files that require a logged-in user.
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

/**
 * Like requireProfile() but also asserts the user is an admin.
 * Redirects to /dashboard if the user is not an admin.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}
