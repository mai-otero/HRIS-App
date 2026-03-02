"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Signs the current user out and redirects to /login.
 * Use as a form action:  <form action={signOut}><button …>Sign out</button></form>
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
