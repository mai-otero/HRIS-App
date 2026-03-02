"use server";

import { redirect } from "next/navigation";
import { requireProfile, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { countWorkingDays } from "@/lib/pto";
import { sendPtoNotification } from "@/lib/email";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Helpers ────────────────────────────────────────────────────

/**
 * Ensures a pto_balances row exists for the given employee and year.
 * Uses the admin client because RLS blocks employee INSERT on pto_balances.
 * Safe to call multiple times — conflict is silently ignored.
 */
async function ensureBalanceRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: SupabaseClient<any>,
  employeeId: string,
  year: number
): Promise<void> {
  await adminClient.from("pto_balances").upsert(
    { employee_id: employeeId, year, base_days: 30, rolled_over_days: 0, manually_added_days: 0 },
    { onConflict: "employee_id,year", ignoreDuplicates: true }
  );
}

// ── Actions ────────────────────────────────────────────────────

/**
 * Submit a new PTO request for the logged-in employee.
 * Calculates working days server-side and checks remaining balance.
 */
export async function submitPtoRequest(
  data: { start_date: string; end_date: string }
): Promise<{ error?: string }> {
  const profile = await requireProfile();

  if (profile.role !== "employee") {
    return { error: "Admins cannot submit PTO requests via this form." };
  }

  const { start_date, end_date } = data;

  if (!start_date || !end_date) {
    return { error: "Start and end dates are required." };
  }

  // Parse as local midnight to avoid UTC timezone shifts
  const start = new Date(start_date + "T00:00:00");
  const end = new Date(end_date + "T00:00:00");

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { error: "Invalid date format." };
  }
  if (end < start) {
    return { error: "End date must be on or after start date." };
  }

  const workingDays = countWorkingDays(start, end);
  if (workingDays === 0) {
    return { error: "The selected range contains no working days (only weekends or public holidays)." };
  }

  const year = start.getFullYear();

  // Check remaining balance via RLS client (employee can only read own summary)
  const supabase = await createClient();
  const { data: summary } = await supabase
    .from("pto_summary")
    .select("remaining_days")
    .eq("employee_id", profile.id)
    .eq("year", year)
    .maybeSingle();

  const remaining = summary?.remaining_days ?? 30;

  if (workingDays > remaining) {
    return {
      error: `This request requires ${workingDays} working day${workingDays === 1 ? "" : "s"} but you only have ${remaining} day${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // Ensure balance row exists (admin client required — RLS blocks employee INSERT)
  const admin = createAdminClient();
  await ensureBalanceRow(admin, profile.id, year);

  // Insert the request (RLS client — DB enforces employee_id = auth.uid())
  const { error: insertError } = await supabase.from("pto_requests").insert({
    employee_id: profile.id,
    start_date,
    end_date,
    working_days: workingDays,
    status: "confirmed",
  });

  if (insertError) return { error: insertError.message };

  // Send notification email — soft fail, never blocks submission
  const { data: emp } = await supabase
    .from("profiles")
    .select("full_name, personal_email")
    .eq("id", profile.id)
    .single();

  await sendPtoNotification({
    employeeName: emp?.full_name ?? "Employee",
    employeeEmail: emp?.personal_email ?? null,
    startDate: start_date,
    endDate: end_date,
    workingDays,
    remainingAfter: remaining - workingDays,
    submittedByAdmin: false,
  }).catch(() => {});

  redirect("/pto");
}

/**
 * Cancel a PTO request.
 * Accepts a FormData with a hidden "id" field — safe for direct <form action> use.
 * Employees can only cancel their own (RLS enforced); admins can cancel any.
 */
export async function cancelPtoRequest(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  if (!id) return;

  const profile = await requireProfile();

  if (profile.role === "admin") {
    const admin = createAdminClient();
    await admin
      .from("pto_requests")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("status", "confirmed");

    redirect("/pto/admin");
  } else {
    // RLS policy enforces employee_id = auth.uid() on UPDATE
    const supabase = await createClient();
    await supabase
      .from("pto_requests")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("status", "confirmed");

    redirect("/pto");
  }
}

/**
 * Admin submits a PTO request on behalf of an employee.
 * Same balance enforcement as the employee flow; bypasses RLS for the insert.
 */
export async function adminSubmitPtoRequest(data: {
  employee_id: string;
  start_date: string;
  end_date: string;
}): Promise<{ error?: string }> {
  await requireAdmin();

  const { employee_id, start_date, end_date } = data;

  if (!employee_id) return { error: "Employee is required." };
  if (!start_date || !end_date) return { error: "Start and end dates are required." };

  const start = new Date(start_date + "T00:00:00");
  const end = new Date(end_date + "T00:00:00");

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { error: "Invalid date format." };
  }
  if (end < start) {
    return { error: "End date must be on or after start date." };
  }

  const workingDays = countWorkingDays(start, end);
  if (workingDays === 0) {
    return { error: "The selected range contains no working days (only weekends or public holidays)." };
  }

  const year = start.getFullYear();
  const admin = createAdminClient();

  // Fetch employee profile
  const { data: emp, error: empError } = await admin
    .from("profiles")
    .select("full_name, personal_email")
    .eq("id", employee_id)
    .single();

  if (empError || !emp) return { error: "Employee not found." };

  // Check balance (admin client — bypasses RLS for cross-employee read)
  const { data: summary } = await admin
    .from("pto_summary")
    .select("remaining_days")
    .eq("employee_id", employee_id)
    .eq("year", year)
    .maybeSingle();

  const remaining = summary?.remaining_days ?? 30;

  if (workingDays > remaining) {
    return {
      error: `This request requires ${workingDays} working day${workingDays === 1 ? "" : "s"} but ${emp.full_name ?? "this employee"} only has ${remaining} day${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  await ensureBalanceRow(admin, employee_id, year);

  const { error: insertError } = await admin.from("pto_requests").insert({
    employee_id,
    start_date,
    end_date,
    working_days: workingDays,
    status: "confirmed",
  });

  if (insertError) return { error: insertError.message };

  // Send notification email
  await sendPtoNotification({
    employeeName: emp.full_name ?? "Employee",
    employeeEmail: emp.personal_email ?? null,
    startDate: start_date,
    endDate: end_date,
    workingDays,
    remainingAfter: remaining - workingDays,
    submittedByAdmin: true,
  }).catch(() => {});

  redirect("/pto/admin");
}

/**
 * Manually adjust an employee's PTO balance (admin only).
 * Inserts into pto_adjustments; a DB trigger auto-syncs manually_added_days.
 */
export async function adminAdjustBalance(data: {
  employee_id: string;
  days: number;
  reason: string;
  year: number;
}): Promise<{ error?: string }> {
  const adminProfile = await requireAdmin();

  const { employee_id, days, reason, year } = data;

  if (!employee_id) return { error: "Employee is required." };
  if (!Number.isInteger(days) || days === 0) return { error: "Days must be a non-zero integer." };
  if (!reason?.trim()) return { error: "Reason is required." };
  if (!Number.isInteger(year) || year < 2020 || year > 2100) return { error: "Invalid year." };

  const admin = createAdminClient();

  // ensureBalanceRow not strictly needed here — the DB trigger handles it,
  // but we call it anyway for safety in case the trigger path differs.
  await ensureBalanceRow(admin, employee_id, year);

  const { error: insertError } = await admin.from("pto_adjustments").insert({
    employee_id,
    admin_id: adminProfile.id,
    days,
    reason: reason.trim(),
    year,
  });

  if (insertError) return { error: insertError.message };

  redirect(`/pto/admin/adjust/${employee_id}`);
}
