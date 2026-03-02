"use client";

import { useState } from "react";

interface Employee {
  id: string;
  full_name: string | null;
}

interface Props {
  employees: Employee[];
  uploadAction: (formData: FormData) => Promise<{ error?: string }>;
}

export default function PayrollUploadForm({ employees, uploadAction }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await uploadAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success the server action calls redirect() — we never reach here
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">

      {error && (
        <div className="flex gap-3 items-start bg-red-950/60 border border-red-900/60 rounded-xl px-4 py-3.5 text-sm text-red-400">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Employee */}
      <div>
        <label htmlFor="employee_id" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Employee
        </label>
        <select
          id="employee_id"
          name="employee_id"
          required
          disabled={loading}
          defaultValue=""
          className="w-full h-11 px-3.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 disabled:opacity-50 transition-all duration-150"
        >
          <option value="" disabled>Select employee…</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.full_name ?? "—"}
            </option>
          ))}
        </select>
      </div>

      {/* Period */}
      <div>
        <label htmlFor="period" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Payroll period
        </label>
        <input
          type="month"
          id="period"
          name="period"
          required
          disabled={loading}
          className="w-full h-11 px-3.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 disabled:opacity-50 transition-all duration-150 [color-scheme:dark]"
        />
      </div>

      {/* File */}
      <div>
        <label htmlFor="file" className="block text-sm font-medium text-zinc-300 mb-1.5">
          File
        </label>
        <input
          type="file"
          id="file"
          name="file"
          required
          disabled={loading}
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          className="w-full h-11 px-3.5 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-700 file:text-zinc-300 hover:file:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 disabled:opacity-50 transition-all duration-150"
        />
        <p className="text-xs text-zinc-600 mt-1.5">PDF, Word, or Excel — max 20 MB</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-11 px-6 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading…
          </span>
        ) : (
          "Upload file"
        )}
      </button>
    </form>
  );
}
