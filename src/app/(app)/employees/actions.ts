"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import type { EmployeeFormData, ContractType } from "@/lib/types";

// ── Helpers ────────────────────────────────────────────────────

function str(v: string): string | null {
  return v.trim() || null;
}
function num(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}
function int(v: string): number | null {
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

function prepareProfileData(data: EmployeeFormData) {
  return {
    full_name:                str(data.full_name),
    personal_email:           str(data.personal_email),
    phone_number:             str(data.phone_number),
    birth_date:               str(data.birth_date),
    address:                  str(data.address),
    job_title:                str(data.job_title),
    contract_type:            (data.contract_type || null) as ContractType | null,
    start_date:               str(data.start_date),
    salary:                   num(data.salary),
    hours_per_week:           num(data.hours_per_week),
    passport_id:              str(data.passport_id),
    bank_account:             str(data.bank_account),
    tax_id:                   str(data.tax_id),
    social_security_number:   str(data.social_security_number),
    tax_class:                int(data.tax_class),
    health_insurance:         str(data.health_insurance),
    emergency_contact_name:   str(data.emergency_contact_name),
    emergency_contact_phone:  str(data.emergency_contact_phone),
    equipment_assigned:       str(data.equipment_assigned),
  };
}

async function getSiteOrigin() {
  const h = await headers();
  const host  = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

// ── Actions ────────────────────────────────────────────────────

/**
 * Invite a new employee: creates an auth.users row (sends invite email)
 * then inserts the full profile row.
 */
export async function createEmployee(
  data: EmployeeFormData
): Promise<{ error?: string }> {
  await requireAdmin();

  const email = data.personal_email.trim();
  if (!email) return { error: "Work email is required." };

  const admin  = createAdminClient();
  const origin = await getSiteOrigin();

  // 1. Create auth user (try invite email first; fall back silently if SMTP isn't configured)
  let userId: string;

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/callback`,
    });

  if (inviteData?.user) {
    userId = inviteData.user.id;
  } else {
    // Email sending failed (e.g. SMTP not configured) — create the user without an invite
    console.warn("Invite email failed, creating user without email:", inviteError?.message);
    const { data: createData, error: createError } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: false,
      });

    if (createError || !createData.user) {
      return { error: createError?.message ?? "Failed to create user account." };
    }
    userId = createData.user.id;
  }

  // 2. Insert profile
  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: userId, ...prepareProfileData(data) });

  if (profileError) {
    // Clean up the dangling auth user so the admin can retry
    await admin.auth.admin.deleteUser(userId);
    return { error: profileError.message };
  }

  redirect(`/employees/${userId}`);
}

/**
 * Update an existing employee's profile. `id` is bound at call-site.
 */
export async function updateEmployee(
  id: string,
  data: EmployeeFormData
): Promise<{ error?: string }> {
  await requireAdmin();

  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update(prepareProfileData(data))
    .eq("id", id);

  if (error) return { error: error.message };

  redirect(`/employees/${id}`);
}

/**
 * Permanently delete an employee — removes storage files, all child rows, and the auth user.
 * Explicit deletes are required because pto_adjustments.admin_id and
 * payroll_files.uploaded_by lack ON DELETE CASCADE and would block the auth user deletion.
 * Irreversible; admin only.
 */
export async function deleteEmployee(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const admin = createAdminClient();

  // 1. Fetch payroll storage paths then purge the files
  const { data: payrollFiles } = await admin
    .from("payroll_files")
    .select("storage_path")
    .eq("employee_id", id);

  if (payrollFiles && payrollFiles.length > 0) {
    const paths = payrollFiles.map((f: { storage_path: string }) => f.storage_path);
    await admin.storage.from("payroll").remove(paths);
  }

  // 2. Also purge any payroll files this user uploaded for other employees
  const { data: uploadedFiles } = await admin
    .from("payroll_files")
    .select("storage_path")
    .eq("uploaded_by", id);

  if (uploadedFiles && uploadedFiles.length > 0) {
    const paths = uploadedFiles.map((f: { storage_path: string }) => f.storage_path);
    await admin.storage.from("payroll").remove(paths);
  }

  // 3. Delete every row that references this profile in a non-cascading FK column:
  //    pto_adjustments.admin_id and payroll_files.uploaded_by have no ON DELETE CASCADE
  await admin.from("pto_adjustments").delete().eq("employee_id", id);
  await admin.from("pto_adjustments").delete().eq("admin_id", id);
  await admin.from("pto_requests").delete().eq("employee_id", id);
  await admin.from("pto_balances").delete().eq("employee_id", id);
  await admin.from("payroll_files").delete().eq("employee_id", id);
  await admin.from("payroll_files").delete().eq("uploaded_by", id);
  await admin.from("profiles").delete().eq("id", id);

  // 4. Delete the auth user (all referencing rows are already gone)
  const { error: deleteError } = await admin.auth.admin.deleteUser(id);
  if (deleteError) return { error: deleteError.message };

  redirect("/employees");
}

/**
 * Deactivate or reactivate an employee. `id` is bound at call-site.
 */
export async function setEmployeeStatus(
  id: string,
  status: "active" | "deactivated"
): Promise<{ error?: string }> {
  await requireAdmin();

  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };

  redirect(`/employees/${id}`);
}
