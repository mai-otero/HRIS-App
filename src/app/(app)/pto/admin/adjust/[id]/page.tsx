import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminAdjustBalance } from "../../../actions";
import AdjustForm from "./AdjustForm";
import type { PtoSummary, PtoAdjustment } from "@/lib/types";

// ── Helpers ────────────────────────────────────────────────────

function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Page ───────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdjustBalancePage({ params }: Props) {
  await requireAdmin();

  const { id: employeeId } = await params;
  const admin = createAdminClient();
  const year = new Date().getFullYear();

  const [
    { data: employee, error: empError },
    { data: summaryData },
    { data: adjustments },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, job_title")
      .eq("id", employeeId)
      .single(),
    admin
      .from("pto_summary")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("year", year)
      .maybeSingle(),
    admin
      .from("pto_adjustments")
      .select("*")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (empError || !employee) redirect("/pto/admin");

  const summary = summaryData as PtoSummary | null;

  // Inline server action that closes over employeeId
  async function adjustAction(formData: FormData): Promise<{ error?: string }> {
    "use server";
    const days = parseInt(formData.get("days") as string, 10);
    const reason = (formData.get("reason") as string) ?? "";
    const yr = parseInt(formData.get("year") as string, 10);
    return adminAdjustBalance({ employee_id: employeeId, days, reason, year: yr });
  }

  const balanceStats = [
    { label: "Base days", value: summary?.base_days ?? 30 },
    { label: "Rolled over", value: summary?.rolled_over_days ?? 0 },
    { label: "Manually adjusted", value: summary?.manually_added_days ?? 0 },
    { label: "Remaining", value: summary?.remaining_days ?? 30, highlight: true },
  ];

  return (
    <div className="p-8 max-w-2xl">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/pto/admin" className="hover:text-zinc-300 transition-colors">
          Time Off Admin
        </Link>
        <svg className="w-3.5 h-3.5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-zinc-300">{employee.full_name ?? "Employee"}</span>
      </nav>

      <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
        Adjust Balance
      </h1>
      <p className="text-sm text-zinc-500 mb-8">
        {employee.full_name ?? "—"}
        {employee.job_title ? <span className="text-zinc-600"> · {employee.job_title}</span> : null}
      </p>

      {/* Current balance card */}
      <div className="bg-zinc-900 rounded-xl ring-1 ring-white/[0.06] overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Balance {year}
          </p>
        </div>
        <div className="grid grid-cols-4 divide-x divide-white/[0.06]">
          {balanceStats.map((s, i) => (
            <div key={i} className="px-4 py-4">
              <p className="text-xs text-zinc-600 mb-1">{s.label}</p>
              <p className={`text-2xl font-semibold tabular-nums ${s.highlight ? "text-brand-400" : "text-white"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Adjustment form */}
      <div className="bg-zinc-900 rounded-2xl ring-1 ring-white/[0.06] px-8 py-7 mb-8">
        <h2 className="text-sm font-semibold text-zinc-300 mb-5">New adjustment</h2>
        <AdjustForm action={adjustAction} defaultYear={year} />
      </div>

      {/* Adjustment history */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Adjustment history
        </h2>
        <div className="bg-zinc-900 rounded-xl ring-1 ring-white/[0.06] overflow-hidden">
          {!adjustments || adjustments.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-zinc-600">
              No adjustments yet
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {(adjustments as PtoAdjustment[]).map((adj) => (
                <li key={adj.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-300">{adj.reason}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {adj.year} · {fmtDateTime(adj.created_at)}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums shrink-0 ${
                      adj.days > 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {adj.days > 0 ? "+" : ""}
                    {adj.days}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

    </div>
  );
}
