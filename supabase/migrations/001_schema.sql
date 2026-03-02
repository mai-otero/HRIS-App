-- ============================================================
-- 001_schema.sql
-- Run this first in the Supabase SQL Editor
-- ============================================================


-- ============================================================
-- TYPES / ENUMS
-- ============================================================

CREATE TYPE public.user_role AS ENUM ('admin', 'employee');
CREATE TYPE public.employee_status AS ENUM ('active', 'deactivated');
CREATE TYPE public.contract_type AS ENUM ('full-time', 'part-time');
CREATE TYPE public.pto_status AS ENUM ('confirmed', 'cancelled');


-- ============================================================
-- PROFILES
-- Linked 1:1 to auth.users. Stores all personal + employment data.
-- ============================================================

CREATE TABLE public.profiles (
  id                        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                      public.user_role NOT NULL DEFAULT 'employee',
  status                    public.employee_status NOT NULL DEFAULT 'active',

  -- Personal info
  full_name                 text,
  personal_email            text,
  phone_number              text,
  birth_date                date,
  address                   text,

  -- Employment
  job_title                 text,
  contract_type             public.contract_type,
  start_date                date,
  salary                    numeric(12, 2),
  hours_per_week            numeric(5, 2),

  -- Legal / German payroll fields
  passport_id               text,           -- ID / passport number
  bank_account              text,           -- IBAN
  tax_id                    text,           -- Steueridentifikationsnummer
  social_security_number    text,           -- Sozialversicherungsnummer
  tax_class                 smallint CHECK (tax_class BETWEEN 1 AND 6),  -- Lohnsteuerklasse
  health_insurance          text,           -- Krankenversicherung provider name

  -- Emergency contact
  emergency_contact_name    text,
  emergency_contact_phone   text,

  -- Equipment
  equipment_assigned        text,           -- free-text list of equipment

  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- PTO BALANCES
-- One row per employee per year. manually_added_days is kept
-- in sync by a trigger on pto_adjustments.
-- ============================================================

CREATE TABLE public.pto_balances (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year                  integer NOT NULL,
  base_days             integer NOT NULL DEFAULT 30,
  rolled_over_days      integer NOT NULL DEFAULT 0 CHECK (rolled_over_days >= 0 AND rolled_over_days <= 5),
  manually_added_days   integer NOT NULL DEFAULT 0,   -- maintained by trigger

  UNIQUE (employee_id, year),

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- PTO ADJUSTMENTS
-- Audit log of every manual balance change made by an admin.
-- Positive days = addition, negative = reduction.
-- ============================================================

CREATE TABLE public.pto_adjustments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id      uuid NOT NULL REFERENCES public.profiles(id),
  days          integer NOT NULL,   -- positive or negative
  reason        text,
  year          integer NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- PTO REQUESTS
-- All requests are auto-confirmed (no approval workflow).
-- working_days is calculated by the app on submission.
-- ============================================================

CREATE TABLE public.pto_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date    date NOT NULL,
  end_date      date NOT NULL,
  working_days  integer NOT NULL CHECK (working_days > 0),
  status        public.pto_status NOT NULL DEFAULT 'confirmed',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);


-- ============================================================
-- PAYROLL FILES
-- Metadata only — actual files live in Supabase Storage.
-- ============================================================

CREATE TABLE public.payroll_files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name     text NOT NULL,
  storage_path  text NOT NULL,         -- path inside the storage bucket
  period        text NOT NULL,         -- e.g. "2025-01"
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  uploaded_by   uuid NOT NULL REFERENCES public.profiles(id)
);


-- ============================================================
-- HELPER FUNCTION: is_admin()
-- SECURITY DEFINER bypasses RLS so it can safely query
-- profiles without causing infinite recursion in policies.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;


-- ============================================================
-- HELPER FUNCTION + TRIGGER: updated_at auto-stamp
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_pto_balances_updated_at
  BEFORE UPDATE ON public.pto_balances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_pto_requests_updated_at
  BEFORE UPDATE ON public.pto_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- TRIGGER: sync manually_added_days on pto_adjustments changes
-- Keeps pto_balances.manually_added_days as the SUM of all
-- adjustment rows for that employee + year.
-- Also auto-creates the balance row if it doesn't exist yet.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_manually_added_days()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id uuid;
  v_year        integer;
BEGIN
  -- Resolve the relevant employee + year
  IF TG_OP = 'DELETE' THEN
    v_employee_id := OLD.employee_id;
    v_year        := OLD.year;
  ELSE
    v_employee_id := NEW.employee_id;
    v_year        := NEW.year;
  END IF;

  -- Ensure a balance row exists for this employee/year
  INSERT INTO public.pto_balances (employee_id, year, base_days, rolled_over_days, manually_added_days)
  VALUES (v_employee_id, v_year, 30, 0, 0)
  ON CONFLICT (employee_id, year) DO NOTHING;

  -- Recalculate manually_added_days from the full adjustment history
  UPDATE public.pto_balances
  SET
    manually_added_days = (
      SELECT COALESCE(SUM(days), 0)
      FROM public.pto_adjustments
      WHERE employee_id = v_employee_id
        AND year = v_year
    ),
    updated_at = now()
  WHERE employee_id = v_employee_id
    AND year = v_year;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_sync_pto_adjustments
  AFTER INSERT OR UPDATE OR DELETE ON public.pto_adjustments
  FOR EACH ROW EXECUTE FUNCTION public.sync_manually_added_days();


-- ============================================================
-- VIEW: pto_summary
-- Convenience view that adds calculated used_days,
-- remaining_days, and upcoming_days to the balance data.
-- Inherits RLS from underlying tables (SECURITY INVOKER).
-- ============================================================

CREATE OR REPLACE VIEW public.pto_summary AS
SELECT
  pb.id,
  pb.employee_id,
  pb.year,
  pb.base_days,
  pb.rolled_over_days,
  pb.manually_added_days,

  -- Days consumed by confirmed requests in this calendar year
  COALESCE((
    SELECT SUM(working_days)
    FROM public.pto_requests
    WHERE employee_id = pb.employee_id
      AND EXTRACT(YEAR FROM start_date) = pb.year
      AND status = 'confirmed'
  ), 0)::integer AS used_days,

  -- Total available minus used
  (pb.base_days + pb.rolled_over_days + pb.manually_added_days) - COALESCE((
    SELECT SUM(working_days)
    FROM public.pto_requests
    WHERE employee_id = pb.employee_id
      AND EXTRACT(YEAR FROM start_date) = pb.year
      AND status = 'confirmed'
  ), 0)::integer AS remaining_days,

  -- Future confirmed time off (upcoming / "pending" on dashboard)
  COALESCE((
    SELECT SUM(working_days)
    FROM public.pto_requests
    WHERE employee_id = pb.employee_id
      AND EXTRACT(YEAR FROM start_date) = pb.year
      AND status = 'confirmed'
      AND start_date > CURRENT_DATE
  ), 0)::integer AS upcoming_days

FROM public.pto_balances pb;


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_pto_requests_employee_id  ON public.pto_requests (employee_id);
CREATE INDEX idx_pto_requests_start_date   ON public.pto_requests (start_date);
CREATE INDEX idx_pto_balances_employee_year ON public.pto_balances (employee_id, year);
CREATE INDEX idx_payroll_files_employee_id  ON public.payroll_files (employee_id);
CREATE INDEX idx_pto_adjustments_employee  ON public.pto_adjustments (employee_id, year);
