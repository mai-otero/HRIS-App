"use client";

import { useState, useEffect } from "react";
import { countWorkingDays } from "@/lib/pto";

interface Props {
  action: (data: { start_date: string; end_date: string }) => Promise<{ error?: string }>;
}

export default function PtoRequestForm({ action }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [preview, setPreview] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) {
      setPreview(null);
      return;
    }
    const s = new Date(startDate + "T00:00:00");
    const e = new Date(endDate + "T00:00:00");
    setPreview(s > e ? 0 : countWorkingDays(s, e));
  }, [startDate, endDate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await action({ start_date: startDate, end_date: endDate });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success the server action calls redirect() — component unmounts
  }

  const canSubmit = !loading && preview !== null && preview > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

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
          <label htmlFor="start_date" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Start date
          </label>
          <input
            type="date"
            id="start_date"
            required
            disabled={loading}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full h-10 px-3.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 disabled:opacity-50 transition-all duration-150 [color-scheme:dark]"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-zinc-300 mb-1.5">
            End date
          </label>
          <input
            type="date"
            id="end_date"
            required
            disabled={loading}
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full h-10 px-3.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 disabled:opacity-50 transition-all duration-150 [color-scheme:dark]"
          />
        </div>
      </div>

      {preview !== null && (
        <div className="px-4 py-3 bg-zinc-800 rounded-lg ring-1 ring-white/[0.06] text-sm flex items-center gap-3">
          <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {preview === 0 ? (
            <span className="text-amber-400">No working days in this range — only weekends or public holidays.</span>
          ) : (
            <span className="text-zinc-300">
              <span className="text-white font-semibold">{preview}</span>
              {" "}working day{preview === 1 ? "" : "s"}
              <span className="text-zinc-500 ml-1">(weekends &amp; German public holidays excluded)</span>
            </span>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="h-11 px-6 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting…
          </span>
        ) : (
          "Submit request"
        )}
      </button>
    </form>
  );
}
