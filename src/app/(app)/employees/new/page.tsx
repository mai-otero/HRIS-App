import { requireAdmin } from "@/lib/auth";
import EmployeeForm from "@/components/EmployeeForm";
import { createEmployee } from "../actions";
import Link from "next/link";

export default async function NewEmployeePage() {
  await requireAdmin();

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/employees" className="hover:text-zinc-300 transition-colors">Employees</Link>
        <span>/</span>
        <span className="text-zinc-300">New employee</span>
      </nav>

      <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
        New employee
      </h1>
      <p className="text-zinc-400 text-sm mb-8">
        Fill in the details below. An invite email will be sent to the work email address.
      </p>

      <EmployeeForm
        action={createEmployee}
        cancelHref="/employees"
        submitLabel="Create employee"
      />
    </div>
  );
}
