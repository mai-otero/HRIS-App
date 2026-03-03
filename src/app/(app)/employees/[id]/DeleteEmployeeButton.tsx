"use client";

import { useState } from "react";

interface Props {
  employeeName: string | null;
  action: () => Promise<{ error?: string }>;
}

export default function DeleteEmployeeButton({ employeeName, action }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const name = employeeName ?? "this employee";
    if (!confirm(`Permanently delete ${name}?\n\nThis will remove their profile, all PTO records, and all payroll files. This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = await action();

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success the server action calls redirect() — component unmounts
  }

  return (
    <div>
      {error && (
        <p className="text-xs text-red-400 mb-2">{error}</p>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className="h-9 px-4 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-white/[0.06] hover:border-red-900/60 text-zinc-500 hover:text-red-400 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Deleting…" : "Delete employee"}
      </button>
    </div>
  );
}
