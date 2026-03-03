import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deletePayrollFile } from "./actions";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────

interface PayrollRow {
  id: string;
  employee_id: string;
  file_name: string;
  storage_path: string;
  period: string;
  uploaded_at: string;
  uploaded_by: string;
  employee?: { id: string; full_name: string | null } | null;
}

// ── Helpers ────────────────────────────────────────────────────

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  if (!year || !month) return period;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function FileIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default async function PayrollPage() {
  const profile = await requireProfile();
  const isAdmin = profile.role === "admin";
  const supabase = await createClient();

  let files: PayrollRow[] = [];

  if (isAdmin) {
    const { data } = await supabase
      .from("payroll_files")
      .select("*, employee:profiles!employee_id(id, full_name)")
      .order("period", { ascending: false })
      .order("uploaded_at", { ascending: false });
    files = (data ?? []) as PayrollRow[];
  } else {
    const { data } = await supabase
      .from("payroll_files")
      .select("*")
      .order("period", { ascending: false })
      .order("uploaded_at", { ascending: false });
    files = (data ?? []) as PayrollRow[];
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Payroll</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            {isAdmin ? `${files.length} file${files.length !== 1 ? "s" : ""}` : "Your payroll documents"}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/payroll/upload"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-indigo-400 to-pink-400 hover:from-indigo-300 hover:to-pink-300 text-white text-sm font-medium rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload file
          </Link>
        )}
      </div>

      {/* Table */}
      {files.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <svg className="w-8 h-8 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          No payroll files yet.
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-xl ring-1 ring-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {isAdmin && <Th>Employee</Th>}
                <Th>File</Th>
                <Th>Period</Th>
                <Th>Uploaded</Th>
                <Th><span className="sr-only">Actions</span></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-zinc-800/40 transition-colors group">
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-300">
                        {file.employee?.full_name ?? "—"}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileIcon />
                      <span className="text-zinc-300 truncate max-w-xs">{file.file_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 ring-1 ring-white/[0.06]">
                      {formatPeriod(file.period)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs tabular-nums">
                    {new Date(file.uploaded_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Download */}
                      <a
                        href={`/api/payroll/download/${file.id}`}
                        className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        Download
                      </a>
                      {/* Delete (admin only) */}
                      {isAdmin && (
                        <form action={deletePayrollFile}>
                          <input type="hidden" name="file_id" value={file.id} />
                          <button
                            type="submit"
                            className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
      {children}
    </th>
  );
}
