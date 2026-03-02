import { signOut } from "@/app/auth/actions";

/**
 * Server Component — no "use client" needed.
 * Uses a form with the signOut server action so it works without JS.
 */
export default function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}
