"use client";

import { useState } from "react";

interface Props {
  action: (formData: FormData) => Promise<{ error?: string }>;
  defaultYear: number;
}

export default function AdjustForm({ action, defaultYear }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await action(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success the server action calls redirect() — component unmounts
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {error && (
        <div className="flex gap-3 items-start bg-red-950/60 border border-red-900/60 rounded-xl px-4 py-3.5 text-sm text-red-400">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="days" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Days <span className="text-zinc-500 font-normal">(positive = add, negative = remove)</span>
          </label>
          <input
            type="number"
            id="days"
            name="days"
            required
            disabled={loading}
            min={-365}
            max={365}
            step={1}
            placeholder="e.g. 5 or −2"
            className="w-full h-10 px-3.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 disabled:opacity-50 transition-all duration-150"
          />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Year
          </label>
          <input
            type="number"
            id="year"
            name="year"
            required
            disabled={loading}
            defaultValue={defaultYear}
            min={2020}
            max={2100}
            step={1}
            className="w-full h-10 px-3.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 disabled:opacity-50 transition-all duration-150"
          />
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Reason
        </label>
        <input
          type="text"
          id="reason"
          name="reason"
          required
          disabled={loading}
          placeholder="e.g. Contractual adjustment, compensation for overtime…"
          className="w-full h-10 px-3.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 disabled:opacity-50 transition-all duration-150"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-11 px-6 rounded-lg bg-gradient-to-br from-indigo-400 to-pink-400 hover:from-indigo-300 hover:to-pink-300 text-white text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving…
          </span>
        ) : (
          "Save adjustment"
        )}
      </button>
    </form>
  );
}
