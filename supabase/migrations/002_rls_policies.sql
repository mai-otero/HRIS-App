-- ============================================================
-- 002_rls_policies.sql
-- Run this second, after 001_schema.sql
-- ============================================================
-- NOTE: Admin operations in the app use the Supabase SERVICE ROLE
-- key (server-side API routes only), which bypasses RLS entirely.
-- The policies below primarily protect employee-side access.
-- The is_admin() function is kept for defence-in-depth.
-- ============================================================


-- ============================================================
-- PROFILES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Employees read their own row; admins read all
CREATE POLICY "profiles: read own or admin"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

-- Only admins (or service role) can insert new profiles
CREATE POLICY "profiles: admin insert"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins (or service role) can update profiles
CREATE POLICY "profiles: admin update"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Deactivation is an update; hard deletes blocked for employees
-- Admins can delete if needed (rare)
CREATE POLICY "profiles: admin delete"
  ON public.profiles FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- PTO BALANCES
-- ============================================================

ALTER TABLE public.pto_balances ENABLE ROW LEVEL SECURITY;

-- Employees read their own balance; admins read all
CREATE POLICY "pto_balances: read own or admin"
  ON public.pto_balances FOR SELECT
  USING (employee_id = auth.uid() OR public.is_admin());

-- Only admins create/modify balance rows
CREATE POLICY "pto_balances: admin insert"
  ON public.pto_balances FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "pto_balances: admin update"
  ON public.pto_balances FOR UPDATE
  USING (public.is_admin());


-- ============================================================
-- PTO ADJUSTMENTS
-- ============================================================

ALTER TABLE public.pto_adjustments ENABLE ROW LEVEL SECURITY;

-- Employees can see their own adjustment history
CREATE POLICY "pto_adjustments: read own or admin"
  ON public.pto_adjustments FOR SELECT
  USING (employee_id = auth.uid() OR public.is_admin());

-- Only admins create adjustments
CREATE POLICY "pto_adjustments: admin insert"
  ON public.pto_adjustments FOR INSERT
  WITH CHECK (public.is_admin());


-- ============================================================
-- PTO REQUESTS
-- ============================================================

ALTER TABLE public.pto_requests ENABLE ROW LEVEL SECURITY;

-- Employees read their own requests; admins read all
CREATE POLICY "pto_requests: read own or admin"
  ON public.pto_requests FOR SELECT
  USING (employee_id = auth.uid() OR public.is_admin());

-- Employees submit their own requests
CREATE POLICY "pto_requests: employee insert"
  ON public.pto_requests FOR INSERT
  WITH CHECK (employee_id = auth.uid());

-- Employees can cancel/edit their own requests; admins can update any
CREATE POLICY "pto_requests: update own or admin"
  ON public.pto_requests FOR UPDATE
  USING (employee_id = auth.uid() OR public.is_admin());

-- Only admins can hard-delete requests
CREATE POLICY "pto_requests: admin delete"
  ON public.pto_requests FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- PAYROLL FILES
-- ============================================================

ALTER TABLE public.payroll_files ENABLE ROW LEVEL SECURITY;

-- Employees read their own payroll files; admins read all
CREATE POLICY "payroll_files: read own or admin"
  ON public.payroll_files FOR SELECT
  USING (employee_id = auth.uid() OR public.is_admin());

-- Only admins upload payroll files
CREATE POLICY "payroll_files: admin insert"
  ON public.payroll_files FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "payroll_files: admin update"
  ON public.payroll_files FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "payroll_files: admin delete"
  ON public.payroll_files FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- PTO SUMMARY VIEW
-- The view uses SECURITY INVOKER (default), so it automatically
-- respects the RLS policies on the underlying pto_balances and
-- pto_requests tables. No extra policy needed.
-- ============================================================
