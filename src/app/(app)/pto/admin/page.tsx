import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelPtoRequest } from "../actions";
import type { PtoRequest, PtoSummary } from "@/lib/types";

// ── Helpers ────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: PtoRequest["status"] }) {
  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-brand-400/[0.12] text-brand-400 ring-1 ring-brand-400/30">
        Confirmed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 ring-1 ring-white/[0.06]">
      Cancelled
    </span>
  );
}

function RemainingBadge({ days }: { days: number }) {
  const color =
    days <= 0
      ? "text-red-400"
      : days <= 10
      ? "text-amber-400"
      : "text-brand-400";
  return <span className={`text-sm font-semibold tabular-nums ${color}`}>{days}</span>;
}

// ── Page ───────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{ tab?: string; status?: string }>;
}

export default async function AdminPtoPage({ searchParams }: Props) {
  await requireAdmin();

  const { tab = "requests", status = "all" } = await searchParams;
  const activeTab = tab === "balances" ? "balances" : "requests";
  const validStatus = ["all", "confirmed", "cancelled"].includes(status) ? status : "all";

  const admin = createAdminClient();
  const year = new Date().getFullYear();

  // ── Data for Requests tab ────────────────────────────────────
  let requestsData: unknown[] = [];
  let remainingMap: Record<string, number> = {};

  if (activeTab === "requests") {
    let query = admin
      .from("pto_requests")
      .select("*, employee:profiles!employee_id(id, full_name)")
      .order("created_at", { ascending: false });

    if (validStatus === "confirmed") query = query.eq("status", "confirmed");
    if (validStatus === "cancelled") query = query.eq("status", "cancelled");

    const [{ data: requests }, { data: summaries }] = await Promise.all([
      query,
      admin.from("pto_summary").select("employee_id, remaining_days").eq("year", year),
    ]);

    requestsData = requests ?? [];
    remainingMap = Object.fromEntries(
      (summaries ?? []).map((s: { employee_id: string; remaining_days: number }) => [
        s.employee_id,
        s.remaining_days,
      ])
    );
  }

  // ── Data for Balances tab ────────────────────────────────────
  let employeesWithBalance: Array<{
    id: string;
    full_name: string | null;
    job_title: string | null;
    summary: PtoSummary | null;
  }> = [];

  if (activeTab === "balances") {
    const [{ data: employees }, { data: summaries }] = await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, job_title")
        .eq("status", "active")
        .eq("role", "employee")
        .order("full_name"),
      admin.from("pto_summary").select("*").eq("year", year),
    ]);

    const summaryMap = Object.fromEntries(
      (summaries ?? []).map((s: PtoSummary) => [s.employee_id, s])
    );

    employeesWithBalance = (employees ?? []).map((emp) => ({
      id: emp.id as string,
      full_name: emp.full_name as string | null,
      job_title: emp.job_title as string | null,
      summary: (summaryMap[emp.id as string] as PtoSummary) ?? null,
    }));
  }

  const topTabs = [
    { key: "requests", label: "Requests" },
    { key: "balances", label: "Balances" },
  ];
  const statusTabs = [
    { key: "all", label: "All" },
    { key: "confirmed", label: "Confirmed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Time Off — All Employees
        </h1>
        <Link
          href="/pto/admin/request"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-br from-indigo-400 to-pink-400 hover:from-indigo-300 hover:to-pink-300 text-white text-sm font-medium transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Request PTO for employee
        </Link>
      </div>

      {/* Top-level tabs: Requests / Balances */}
      <div className="flex gap-1 mb-5 bg-zinc-900 rounded-lg ring-1 ring-white/[0.06] p-1 w-fit">
        {topTabs.map((t) => (
          <Link
            key={t.key}
            href={`/pto/admin?tab=${t.key}`}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── REQUESTS TAB ─────────────────────────────────────── */}
      {activeTab === "requests" && (
        <>
          {/* Status filter sub-tabs */}
          <div className="flex gap-1 mb-5">
            {statusTabs.map((t) => (
              <Link
                key={t.key}
                href={
                  t.key === "all"
                    ? "/pto/admin?tab=requests"
                    : `/pto/admin?tab=requests&status=${t.key}`
                }
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  validStatus === t.key
                    ? "bg-zinc-800 text-white ring-1 ring-white/[0.08]"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          <div className="bg-zinc-900 rounded-xl ring-1 ring-white/[0.06] overflow-hidden">
            {requestsData.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-zinc-600">No requests found</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Dates</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Days</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Remaining</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(requestsData as Array<Record<string, unknown>>).map((req) => {
                    const employeeId = req.employee_id as string;
                    const employee = req.employee as { id: string; full_name: string | null } | null;
                    const remaining = remainingMap[employeeId];

                    return (
                      <tr
                        key={req.id as string}
                        className="border-t border-white/[0.06] hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-zinc-200 font-medium">
                          {employee?.full_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-400">
                          {fmtDate(req.start_date as string)}
                          <span className="text-zinc-600 mx-1.5">→</span>
                          {fmtDate(req.end_date as string)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-400 tabular-nums">
                          {req.working_days as number} day{(req.working_days as number) === 1 ? "" : "s"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={req.status as PtoRequest["status"]} />
                        </td>
                        <td className="px-4 py-3">
                          {remaining != null ? (
                            <span className="text-sm text-zinc-400 tabular-nums">
                              {remaining} day{remaining === 1 ? "" : "s"} left
                            </span>
                          ) : (
                            <span className="text-sm text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/pto/admin/adjust/${employeeId}`}
                              className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                            >
                              Adjust
                            </Link>
                            {req.status === "confirmed" && (
                              <form action={cancelPtoRequest}>
                                <input type="hidden" name="id" value={req.id as string} />
                                <button
                                  type="submit"
                                  className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                                >
                                  Cancel
                                </button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── BALANCES TAB ─────────────────────────────────────── */}
      {activeTab === "balances" && (
        <div className="bg-zinc-900 rounded-xl ring-1 ring-white/[0.06] overflow-hidden">
          {employeesWithBalance.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-zinc-600">No active employees found</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Employee</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wide">Available</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wide">Used</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wide">Upcoming</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wide">Remaining</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employeesWithBalance.map(({ id, full_name, job_title, summary }) => {
                  const base = summary?.base_days ?? 30;
                  const rolled = summary?.rolled_over_days ?? 0;
                  const manual = summary?.manually_added_days ?? 0;
                  const available = base + rolled + manual;
                  const used = summary?.used_days ?? 0;
                  const upcoming = summary?.upcoming_days ?? 0;
                  const remaining = summary?.remaining_days ?? 30;

                  return (
                    <tr
                      key={id}
                      className="border-t border-white/[0.06] hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm text-zinc-200 font-medium">{full_name ?? "—"}</p>
                        {job_title && (
                          <p className="text-xs text-zinc-600 mt-0.5">{job_title}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-zinc-400 tabular-nums">{available}</td>
                      <td className="px-4 py-3 text-center text-sm text-zinc-400 tabular-nums">{used}</td>
                      <td className="px-4 py-3 text-center text-sm text-zinc-400 tabular-nums">{upcoming}</td>
                      <td className="px-4 py-3 text-center tabular-nums">
                        <RemainingBadge days={remaining} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/pto/admin/adjust/${id}`}
                            className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                          >
                            Adjust
                          </Link>
                          <Link
                            href={`/pto/admin/request?employee=${id}`}
                            className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                          >
                            Request
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
