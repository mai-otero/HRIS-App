import { redirect } from "next/navigation";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cancelPtoRequest } from "./actions";
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
      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 ring-1 ring-emerald-900/40">
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

function BalanceCard({ summary }: { summary: PtoSummary | null }) {
  const base = summary?.base_days ?? 30;
  const rolled = summary?.rolled_over_days ?? 0;
  const manual = summary?.manually_added_days ?? 0;
  const available = base + rolled + manual;
  const used = summary?.used_days ?? 0;
  const upcoming = summary?.upcoming_days ?? 0;
  const remaining = summary?.remaining_days ?? 30;

  const stats = [
    { label: "Available", value: available, sub: `${base} base + ${rolled} rollover + ${manual} adjusted` },
    { label: "Used", value: used, sub: "confirmed days taken" },
    { label: "Upcoming", value: upcoming, sub: "scheduled future days" },
    { label: "Remaining", value: remaining, sub: "days left this year", highlight: true },
  ];

  return (
    <div className="bg-zinc-900 rounded-xl ring-1 ring-white/[0.06] overflow-hidden mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.06]">
        {stats.map((s, i) => (
          <div key={i} className="px-6 py-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-3xl font-semibold tabular-nums ${s.highlight ? "text-brand-400" : "text-white"}`}>
              {s.value}
            </p>
            <p className="text-xs text-zinc-600 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="px-6 py-10 text-center text-sm text-zinc-600">{label}</div>
  );
}

function RequestRow({
  req,
  showCancel,
}: {
  req: PtoRequest;
  showCancel: boolean;
}) {
  return (
    <tr className="border-t border-white/[0.06] hover:bg-zinc-800/40 transition-colors group">
      <td className="px-4 py-3 text-sm text-zinc-300">
        {fmtDate(req.start_date)}
        <span className="text-zinc-600 mx-1.5">→</span>
        {fmtDate(req.end_date)}
      </td>
      <td className="px-4 py-3 text-sm text-zinc-400 tabular-nums">
        {req.working_days} day{req.working_days === 1 ? "" : "s"}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={req.status} />
      </td>
      <td className="px-4 py-3 text-right">
        {showCancel && req.status === "confirmed" && (
          <form action={cancelPtoRequest}>
            <input type="hidden" name="id" value={req.id} />
            <button
              type="submit"
              className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
            >
              Cancel
            </button>
          </form>
        )}
      </td>
    </tr>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default async function PtoPage() {
  const profile = await requireProfile();
  if (profile.role === "admin") redirect("/pto/admin");

  const supabase = await createClient();
  const year = new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: summaryData }, { data: requests }] = await Promise.all([
    supabase
      .from("pto_summary")
      .select("*")
      .eq("employee_id", profile.id)
      .eq("year", year)
      .maybeSingle(),
    supabase
      .from("pto_requests")
      .select("*")
      .eq("employee_id", profile.id)
      .order("start_date", { ascending: false }),
  ]);

  const summary = summaryData as PtoSummary | null;
  const allRequests = (requests ?? []) as PtoRequest[];

  const upcoming = allRequests.filter(
    (r) => r.status === "confirmed" && r.start_date >= today
  );
  const history = allRequests.filter(
    (r) => r.start_date < today || r.status === "cancelled"
  );

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Time Off</h1>
          <p className="text-sm text-zinc-500 mt-1">{year} calendar year</p>
        </div>
        <Link
          href="/pto/request"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Request Time Off
        </Link>
      </div>

      {/* Balance */}
      <BalanceCard summary={summary} />

      {/* Upcoming */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Upcoming
        </h2>
        <div className="bg-zinc-900 rounded-xl ring-1 ring-white/[0.06] overflow-hidden">
          {upcoming.length === 0 ? (
            <EmptyState label="No upcoming time off scheduled" />
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {upcoming.map((req) => (
                  <RequestRow key={req.id} req={req} showCancel={true} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* History */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          History
        </h2>
        <div className="bg-zinc-900 rounded-xl ring-1 ring-white/[0.06] overflow-hidden">
          {history.length === 0 ? (
            <EmptyState label="No past requests" />
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {history.map((req) => (
                  <RequestRow key={req.id} req={req} showCancel={false} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

    </div>
  );
}
