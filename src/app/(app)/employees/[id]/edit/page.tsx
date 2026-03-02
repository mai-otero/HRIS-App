import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import EmployeeForm from "@/components/EmployeeForm";
import { updateEmployee } from "../../actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Profile, EmployeeFormData } from "@/lib/types";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) redirect("/employees");
  const profile = data as Profile;

  const defaultValues: Partial<EmployeeFormData> = {
    full_name:                profile.full_name              ?? "",
    personal_email:           profile.personal_email         ?? "",
    phone_number:             profile.phone_number           ?? "",
    birth_date:               profile.birth_date             ?? "",
    address:                  profile.address                ?? "",
    job_title:                profile.job_title              ?? "",
    contract_type:            profile.contract_type          ?? "",
    start_date:               profile.start_date             ?? "",
    salary:                   profile.salary != null         ? String(profile.salary)          : "",
    hours_per_week:           profile.hours_per_week != null ? String(profile.hours_per_week)  : "",
    passport_id:              profile.passport_id            ?? "",
    bank_account:             profile.bank_account           ?? "",
    tax_id:                   profile.tax_id                 ?? "",
    social_security_number:   profile.social_security_number ?? "",
    tax_class:                profile.tax_class != null      ? String(profile.tax_class)       : "",
    health_insurance:         profile.health_insurance       ?? "",
    emergency_contact_name:   profile.emergency_contact_name  ?? "",
    emergency_contact_phone:  profile.emergency_contact_phone ?? "",
    equipment_assigned:       profile.equipment_assigned     ?? "",
  };

  async function updateAction(data: EmployeeFormData): Promise<{ error?: string }> {
    "use server";
    return updateEmployee(id, data);
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/employees" className="hover:text-zinc-300 transition-colors">Employees</Link>
        <span>/</span>
        <Link href={`/employees/${id}`} className="hover:text-zinc-300 transition-colors">
          {profile.full_name ?? "Profile"}
        </Link>
        <span>/</span>
        <span className="text-zinc-300">Edit</span>
      </nav>

      <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
        Edit employee
      </h1>
      <p className="text-zinc-400 text-sm mb-8">
        Update the details below. The work email address cannot be changed.
      </p>

      <EmployeeForm
        action={updateAction}
        defaultValues={defaultValues}
        isEditMode
        cancelHref={`/employees/${id}`}
        submitLabel="Save changes"
      />
    </div>
  );
}
