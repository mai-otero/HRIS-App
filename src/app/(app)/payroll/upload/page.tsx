import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uploadPayrollFile } from "../actions";
import PayrollUploadForm from "@/components/PayrollUploadForm";
import Link from "next/link";

export default async function PayrollUploadPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("status", "active")
    .eq("role", "employee")
    .order("full_name", { ascending: true });

  const employees = (data ?? []) as { id: string; full_name: string | null }[];

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/payroll"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to payroll
        </Link>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Upload payroll file</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Attach a payslip or payroll document to an employee record.</p>
      </div>

      <div className="bg-zinc-900 rounded-2xl ring-1 ring-white/[0.06] px-8 py-7">
        {employees.length === 0 ? (
          <p className="text-sm text-zinc-500">No active employees found. Create an employee first.</p>
        ) : (
          <PayrollUploadForm employees={employees} uploadAction={uploadPayrollFile} />
        )}
      </div>
    </div>
  );
}
