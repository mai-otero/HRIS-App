"use client";

import { useState } from "react";

interface Props {
  action: (email: string) => Promise<{ error?: string }>;
}

export default function DevLoginForm({ action }: Props) {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await action(email);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // on success the server action calls redirect() — we never reach here
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-amber-700/50 bg-amber-950/20 px-5 py-4">
      <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest mb-3">
        Dev bypass — no email needed
      </p>

      {error && (
        <p className="text-xs text-red-400 mb-2">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="flex-1 h-9 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-9 px-3 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50 transition-colors shrink-0"
        >
          {loading ? "…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
