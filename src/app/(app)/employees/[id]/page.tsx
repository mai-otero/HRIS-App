import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { setEmployeeStatus } from "../actions";
import type { Profile } from "@/lib/types";

const AVATAR_GRADIENTS = [
  "from-pink-400 to-indigo-400",
  "from-indigo-400 to-sky-400",
  "from-sky-400 to-pink-400",
  "from-pink-400 to-sky-400",
  "from-indigo-400 to-pink-400",
];

function avatarGradient(name: string | null): string {
  if (!name) return "from-indigo-400 to-pink-400";
  const n = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[n % AVATAR_GRADIENTS.length];
}

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireProfile();

  // Employees can only view their own profile
  if (viewer.role === "employee" && viewer.id !== id) {
    redirect(`/employees/${viewer.id}`);
  }

  // Fetch the target profile (admin uses service role to guarantee access)
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) redirect("/employees");
  const profile = data as Profile;

  const isAdmin  = viewer.role === "admin";
  const isOwn    = viewer.id === id;

  async function deactivateAction() {
    "use server";
    await setEmployeeStatus(id, "deactivated");
  }
  async function reactivateAction() {
    "use server";
    await setEmployeeStatus(id, "active");
  }
  return (
    <div className="p-8">
      {/* Breadcrumb (admin only) */}
      {isAdmin && (
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link href="/employees" className="hover:text-zinc-300 transition-colors">Employees</Link>
          <span>/</span>
          <span className="text-zinc-300">{profile.full_name ?? "Profile"}</span>
        </nav>
      )}

      {/* Profile header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${avatarGradient(profile.full_name)} ring-1 ring-white/[0.08] flex items-center justify-center shrink-0`}>
            <span className="text-lg font-semibold text-white">
              {profile.full_name
                ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                : "?"}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              {profile.full_name ?? "—"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-zinc-400 text-sm">{profile.job_title ?? "No job title"}</span>
              <span className="text-zinc-700">·</span>
              <StatusBadge status={profile.status} />
            </div>
          </div>
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/employees/${id}/edit`}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg ring-1 ring-white/[0.06] transition-colors"
            >
              Edit
            </Link>
            {profile.status === "active" ? (
              <form action={deactivateAction}>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-800 hover:bg-red-950/60 hover:text-red-400 text-zinc-400 text-sm font-medium rounded-lg ring-1 ring-white/[0.06] transition-colors"
                >
                  Deactivate
                </button>
              </form>
            ) : (
              <form action={reactivateAction}>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-800 hover:bg-emerald-950/60 hover:text-emerald-400 text-zinc-400 text-sm font-medium rounded-lg ring-1 ring-white/[0.06] transition-colors"
                >
                  Reactivate
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-6 max-w-3xl">
        <ProfileSection title="Personal information">
          <FieldGrid>
            <ProfileField label="Full name"     value={profile.full_name} />
            <ProfileField label="Work email"    value={profile.personal_email} />
            <ProfileField label="Phone"         value={profile.phone_number} />
            <ProfileField label="Date of birth" value={fmtDate(profile.birth_date)} />
            <ProfileField label="Address"       value={profile.address} span={2} />
          </FieldGrid>
        </ProfileSection>

        <ProfileSection title="Employment">
          <FieldGrid>
            <ProfileField label="Job title"      value={profile.job_title} />
            <ProfileField label="Contract type"  value={fmtContract(profile.contract_type)} />
            <ProfileField label="Start date"     value={fmtDate(profile.start_date)} />
            <ProfileField label="Salary"         value={profile.salary != null ? `€${Number(profile.salary).toLocaleString("de-DE")} / mo` : null} />
            <ProfileField label="Hours / week"   value={profile.hours_per_week != null ? `${profile.hours_per_week}h` : null} />
          </FieldGrid>
        </ProfileSection>

        {/* Legal section — visible to admin always, and to the employee for their own profile */}
        {(isAdmin || isOwn) && (
          <ProfileSection title="Legal & payroll">
            <FieldGrid>
              <ProfileField label="ID / Passport no."              value={profile.passport_id} />
              <ProfileField label="IBAN"                           value={profile.bank_account} />
              <ProfileField label="Steueridentifikationsnummer"    value={profile.tax_id} />
              <ProfileField label="Sozialversicherungsnummer"      value={profile.social_security_number} />
              <ProfileField label="Lohnsteuerklasse"               value={profile.tax_class != null ? `Class ${profile.tax_class}` : null} />
              <ProfileField label="Krankenversicherung"            value={profile.health_insurance} />
            </FieldGrid>
          </ProfileSection>
        )}

        <ProfileSection title="Emergency contact">
          <FieldGrid>
            <ProfileField label="Name"  value={profile.emergency_contact_name} />
            <ProfileField label="Phone" value={profile.emergency_contact_phone} />
          </FieldGrid>
        </ProfileSection>

        <ProfileSection title="Equipment">
          <FieldGrid>
            <ProfileField label="Assigned equipment" value={profile.equipment_assigned} span={2} />
          </FieldGrid>
        </ProfileSection>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtContract(c: string | null) {
  if (!c) return null;
  return c === "full-time" ? "Full-time" : "Part-time";
}

// ── Sub-components ─────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return status === "active" ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-400">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />Deactivated
    </span>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 rounded-xl ring-1 ring-white/[0.06] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.05]">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
      {children}
    </dl>
  );
}

function ProfileField({
  label,
  value,
  span,
}: {
  label: string;
  value: string | null | undefined;
  span?: number;
}) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-zinc-500 mb-0.5">{label}</dt>
      <dd className="text-sm text-zinc-200">{value ?? <span className="text-zinc-600">—</span>}</dd>
    </div>
  );
}
