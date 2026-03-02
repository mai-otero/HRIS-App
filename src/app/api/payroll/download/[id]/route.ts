import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/payroll/download/[id]
 *
 * Verifies the requesting user has access to the payroll file (via DB RLS),
 * then generates a short-lived (60 s) signed URL and redirects to it.
 * Employees can only access their own files; admins can access all.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Verify access using the session-based client (RLS enforced)
  const supabase = await createClient();
  const { data: file, error } = await supabase
    .from("payroll_files")
    .select("storage_path, file_name")
    .eq("id", id)
    .single();

  if (error || !file) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // 2. Generate signed URL using admin client (bypasses storage RLS so we
  //    don't need per-user storage policies — access is controlled at DB level above).
  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("payroll-files")
    .createSignedUrl(file.storage_path, 60, {
      download: file.file_name,
    });

  if (signError || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Failed to generate download link." },
      { status: 500 }
    );
  }

  return NextResponse.redirect(signed.signedUrl);
}
