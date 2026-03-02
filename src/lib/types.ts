// ============================================================
// Database types — mirror the Supabase schema exactly.
// ============================================================

export type UserRole = "admin" | "employee";
export type EmployeeStatus = "active" | "deactivated";
export type ContractType = "full-time" | "part-time";
export type PtoStatus = "confirmed" | "cancelled";

export interface Profile {
  id: string;
  role: UserRole;
  status: EmployeeStatus;

  // Personal
  full_name: string | null;
  personal_email: string | null;
  phone_number: string | null;
  birth_date: string | null;
  address: string | null;

  // Employment
  job_title: string | null;
  contract_type: ContractType | null;
  start_date: string | null;
  salary: number | null;
  hours_per_week: number | null;

  // Legal / German payroll
  passport_id: string | null;
  bank_account: string | null;
  tax_id: string | null;
  social_security_number: string | null;
  tax_class: number | null;
  health_insurance: string | null;

  // Emergency contact
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;

  // Equipment
  equipment_assigned: string | null;

  created_at: string;
  updated_at: string;
}

export interface PtoBalance {
  id: string;
  employee_id: string;
  year: number;
  base_days: number;
  rolled_over_days: number;
  manually_added_days: number;
  created_at: string;
  updated_at: string;
}

/** Result of querying the pto_summary view */
export interface PtoSummary {
  id: string;
  employee_id: string;
  year: number;
  base_days: number;
  rolled_over_days: number;
  manually_added_days: number;
  used_days: number;
  remaining_days: number;
  upcoming_days: number;
}

export interface PtoAdjustment {
  id: string;
  employee_id: string;
  admin_id: string;
  days: number;
  reason: string | null;
  year: number;
  created_at: string;
}

export interface PtoRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  working_days: number;
  status: PtoStatus;
  created_at: string;
  updated_at: string;
}

export interface PayrollFile {
  id: string;
  employee_id: string;
  file_name: string;
  storage_path: string;
  period: string;
  uploaded_at: string;
  uploaded_by: string;
}

// ── Employee form ──────────────────────────────────────────────
// All fields as strings so HTML inputs are uncontrolled-friendly.
// Server actions convert to the correct DB types before inserting.
export interface EmployeeFormData {
  full_name: string;
  personal_email: string;
  phone_number: string;
  birth_date: string;
  address: string;
  job_title: string;
  contract_type: "" | "full-time" | "part-time";
  start_date: string;
  salary: string;
  hours_per_week: string;
  passport_id: string;
  bank_account: string;
  tax_id: string;
  social_security_number: string;
  tax_class: string;
  health_insurance: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  equipment_assigned: string;
}
