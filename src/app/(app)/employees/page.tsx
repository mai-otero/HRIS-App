import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Profile } from "@/lib/types";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const { status = "active" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, personal_email, job_title, contract_type, start_date, status, role")
    .order("full_name", { ascending: true });

  if (status === "all") {
    // no filter
  } else {
    query = query.eq("status", status === "deactivated" ? "deactivated" : "active");
  }

  const { data: employees } = await query;
  const list = (employees ?? []) as Pick<
    Profile,
    "id" | "full_name" | "personal_email" | "job_title" | "contract_type" | "start_date" | "status" | "role"
  >[];

  const tabs = [
    { label: "Active",      value: "active" },
    { label: "Deactivated", value: "deactivated" },
    { label: "All",         value: "all" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Employees</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{list.length} record{list.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/employees/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New employee
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-900 rounded-lg p-1 w-fit ring-1 ring-white/[0.06]">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/employees?status=${tab.value}`}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              status === tab.value
                ? "bg-zinc-700 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      {list.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <svg className="w-8 h-8 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          No employees found.
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-xl ring-1 ring-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <Th>Name</Th>
                <Th>Job title</Th>
                <Th>Contract</Th>
                <Th>Start date</Th>
                <Th>Status</Th>
                <Th><span className="sr-only">Actions</span></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {list.map((emp) => {
                const initials = emp.full_name
                  ? emp.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                  : "?";
                return (
                  <tr key={emp.id} className="hover:bg-zinc-800/40 transition-colors group">
                    <td className="px-4 py-3">
                      <Link href={`/employees/${emp.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-zinc-300">{initials}</span>
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-brand-400 transition-colors">
                            {emp.full_name ?? "—"}
                          </p>
                          <p className="text-xs text-zinc-500">{emp.personal_email ?? "—"}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{emp.job_title ?? "—"}</td>
                    <td className="px-4 py-3">
                      {emp.contract_type ? (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 ring-1 ring-white/[0.06] capitalize">
                          {emp.contract_type}
                        </span>
                      ) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 tabular-nums">
                      {emp.start_date
                        ? new Date(emp.start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/employees/${emp.id}/edit`}
                        className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
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

function StatusBadge({ status }: { status: string }) {
  return status === "active" ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
      Deactivated
    </span>
  );
}
