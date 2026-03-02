-- ============================================================
-- 003_storage.sql
-- Run this third, after 002_rls_policies.sql
-- ============================================================
-- Creates the private payroll-files storage bucket and
-- sets up Row Level Security policies on storage.objects.
-- ============================================================


-- ============================================================
-- CREATE BUCKET
-- private = true means files are NOT publicly accessible.
-- Signed URLs (generated server-side) are used for downloads.
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('payroll-files', 'payroll-files', false)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- STORAGE RLS POLICIES
-- storage.objects has its own RLS separate from public tables.
-- The path convention is: payroll-files/{employee_id}/{filename}
-- ============================================================

-- Employees can read (download) only files in their own folder.
-- Admins can read everything.
CREATE POLICY "payroll storage: read own or admin"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payroll-files'
    AND (
      -- Employee: path starts with their own UUID
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- Admin check
      public.is_admin()
    )
  );

-- Only admins can upload payroll files
CREATE POLICY "payroll storage: admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payroll-files'
    AND public.is_admin()
  );

-- Only admins can replace / update payroll files
CREATE POLICY "payroll storage: admin update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'payroll-files'
    AND public.is_admin()
  );

-- Only admins can delete payroll files
CREATE POLICY "payroll storage: admin delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'payroll-files'
    AND public.is_admin()
  );
