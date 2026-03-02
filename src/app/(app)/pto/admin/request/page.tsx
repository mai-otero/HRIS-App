import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminSubmitPtoRequest } from "../../actions";
import AdminPtoRequestForm from "./AdminPtoRequestForm";

interface Props {
  searchParams: Promise<{ employee?: string }>;
}

export default async function AdminPtoRequestPage({ searchParams }: Props) {
  await requireAdmin();

  const { employee: preselectedId } = await searchParams;
  const admin = createAdminClient();

  const { data: employees } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("status", "active")
    .eq("role", "employee")
    .order("full_name");

  return (
    <div className="p-8 max-w-2xl">

      <Link
        href="/pto/admin"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Time Off Admin
      </Link>

      <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
        Request Time Off for Employee
      </h1>
      <p className="text-sm text-zinc-500 mb-8">
        Working days calculated automatically, excluding weekends and German national public holidays.
        The employee and all admins will be notified by email.
      </p>

      <div className="bg-zinc-900 rounded-2xl ring-1 ring-white/[0.06] px-8 py-7">
        <AdminPtoRequestForm
          employees={employees ?? []}
          defaultEmployeeId={preselectedId}
          action={adminSubmitPtoRequest}
        />
      </div>

    </div>
  );
}
