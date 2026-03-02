-- ============================================================
-- seed.sql — Bootstrap admin profiles
-- ============================================================
-- Run this AFTER the two admin users have signed in via magic
-- link at least once (so their auth.users rows exist).
--
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Find each admin's UUID (the "UID" column)
-- 3. Replace the placeholder UUIDs below
-- 4. Run in the SQL Editor
-- ============================================================

INSERT INTO public.profiles (id, role, status, full_name, personal_email)
VALUES
  (
    'REPLACE-WITH-ADMIN-1-AUTH-UUID',   -- from Authentication → Users
    'admin',
    'active',
    'Admin One Name',
    'admin1@yourcompany.com'
  ),
  (
    'REPLACE-WITH-ADMIN-2-AUTH-UUID',
    'admin',
    'active',
    'Admin Two Name',
    'admin2@yourcompany.com'
  )
ON CONFLICT (id) DO UPDATE SET role = 'admin';  -- safe to re-run

-- Verify
SELECT id, full_name, role, status FROM public.profiles;
