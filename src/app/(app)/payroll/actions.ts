"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function uploadPayrollFile(
  formData: FormData
): Promise<{ error?: string }> {
  const profile = await requireAdmin();

  const employeeId = formData.get("employee_id") as string;
  const period = formData.get("period") as string; // YYYY-MM
  const file = formData.get("file") as File;

  if (!employeeId || !period || !file || file.size === 0) {
    return { error: "All fields are required." };
  }

  // Sanitise file name — strip path separators that could escape the prefix
  const safeName = file.name.replace(/[/\\]/g, "_");
  const storagePath = `${employeeId}/${period}/${safeName}`;

  const admin = createAdminClient();

  // 1. Upload to private storage bucket
  const { error: uploadError } = await admin.storage
    .from("payroll-files")
    .upload(storagePath, file, { upsert: false });

  if (uploadError) {
    return {
      error:
        uploadError.message.includes("already exists") ||
        uploadError.message.includes("Duplicate")
          ? `A file named "${safeName}" already exists for this period. Delete it first or rename your file.`
          : uploadError.message,
    };
  }

  // 2. Insert metadata row
  const { error: dbError } = await admin.from("payroll_files").insert({
    employee_id: employeeId,
    file_name: safeName,
    storage_path: storagePath,
    period,
    uploaded_by: profile.id,
  });

  if (dbError) {
    // Roll back the storage object so we don't leave orphans
    await admin.storage.from("payroll-files").remove([storagePath]);
    return { error: dbError.message };
  }

  redirect("/payroll");
}

export async function deletePayrollFile(formData: FormData): Promise<void> {
  await requireAdmin();

  const fileId = formData.get("file_id") as string;
  if (!fileId) return;

  const admin = createAdminClient();

  // Fetch storage path before deleting the row
  const { data: file } = await admin
    .from("payroll_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (file?.storage_path) {
    await admin.storage.from("payroll-files").remove([file.storage_path]);
  }

  await admin.from("payroll_files").delete().eq("id", fileId);

  redirect("/payroll");
}
