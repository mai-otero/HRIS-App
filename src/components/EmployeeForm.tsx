"use client";

import { useState } from "react";
import Link from "next/link";
import type { EmployeeFormData } from "@/lib/types";

interface Props {
  /** Bound server action — signature is (data: EmployeeFormData) => Promise<{error?}> */
  action: (data: EmployeeFormData) => Promise<{ error?: string }>;
  defaultValues?: Partial<EmployeeFormData>;
  /** In edit mode the email field is read-only */
  isEditMode?: boolean;
  cancelHref: string;
  submitLabel?: string;
}

const EMPTY: EmployeeFormData = {
  full_name: "",           personal_email: "",
  phone_number: "",        birth_date: "",
  address: "",             job_title: "",
  contract_type: "",       start_date: "",
  salary: "",              hours_per_week: "",
  passport_id: "",         bank_account: "",
  tax_id: "",              social_security_number: "",
  tax_class: "",           health_insurance: "",
  emergency_contact_name: "",  emergency_contact_phone: "",
  equipment_assigned: "",
};

export default function EmployeeForm({
  action,
  defaultValues,
  isEditMode = false,
  cancelHref,
  submitLabel = "Save changes",
}: Props) {
  const [form, setForm] = useState<EmployeeFormData>({ ...EMPTY, ...defaultValues });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function set(key: keyof EmployeeFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await action(form);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // on success, the server action calls redirect() so we never reach here
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">

      {/* Top-level error */}
      {error && (
        <div className="flex gap-3 items-start bg-red-950/60 border border-red-900/60 rounded-xl px-4 py-3.5 text-sm text-red-400">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Section 1: Personal information ─────────────────── */}
      <Section title="Personal information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" required>
            <Input
              value={form.full_name}
              onChange={(v) => set("full_name", v)}
              placeholder="Jane Smith"
              required
            />
          </Field>

          <Field label="Work email" required>
            <Input
              type="email"
              value={form.personal_email}
              onChange={(v) => set("personal_email", v)}
              placeholder="jane@superlist.com"
              required
              disabled={isEditMode}
              title={isEditMode ? "Email cannot be changed after creation" : undefined}
            />
          </Field>

          <Field label="Phone">
            <Input
              type="tel"
              value={form.phone_number}
              onChange={(v) => set("phone_number", v)}
              placeholder="+49 123 456 789"
            />
          </Field>

          <Field label="Date of birth">
            <Input
              type="date"
              value={form.birth_date}
              onChange={(v) => set("birth_date", v)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Address">
              <Input
                value={form.address}
                onChange={(v) => set("address", v)}
                placeholder="Musterstraße 12, 10115 Berlin"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 2: Employment ────────────────────────────── */}
      <Section title="Employment">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Job title">
            <Input
              value={form.job_title}
              onChange={(v) => set("job_title", v)}
              placeholder="Software Engineer"
            />
          </Field>

          <Field label="Contract type">
            <Select
              value={form.contract_type}
              onChange={(v) => set("contract_type", v as EmployeeFormData["contract_type"])}
              options={[
                { value: "",           label: "Select…"    },
                { value: "full-time",  label: "Full-time"  },
                { value: "part-time",  label: "Part-time"  },
              ]}
            />
          </Field>

          <Field label="Start date">
            <Input
              type="date"
              value={form.start_date}
              onChange={(v) => set("start_date", v)}
            />
          </Field>

          <Field label="Salary (€ / month)">
            <Input
              type="number"
              value={form.salary}
              onChange={(v) => set("salary", v)}
              placeholder="3500"
              min="0"
              step="0.01"
            />
          </Field>

          <Field label="Hours per week">
            <Input
              type="number"
              value={form.hours_per_week}
              onChange={(v) => set("hours_per_week", v)}
              placeholder="40"
              min="0"
              max="60"
              step="0.5"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 3: Legal & payroll ───────────────────────── */}
      <Section title="Legal & payroll">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ID / Passport no.">
            <Input
              value={form.passport_id}
              onChange={(v) => set("passport_id", v)}
              placeholder="L01234567"
            />
          </Field>

          <Field label="IBAN">
            <Input
              value={form.bank_account}
              onChange={(v) => set("bank_account", v)}
              placeholder="DE89 3704 0044 0532 0130 00"
            />
          </Field>

          <Field label="Steueridentifikationsnummer">
            <Input
              value={form.tax_id}
              onChange={(v) => set("tax_id", v)}
              placeholder="12 345 678 901"
            />
          </Field>

          <Field label="Sozialversicherungsnummer">
            <Input
              value={form.social_security_number}
              onChange={(v) => set("social_security_number", v)}
              placeholder="65 040895 M 003"
            />
          </Field>

          <Field label="Lohnsteuerklasse (Tax class)">
            <Select
              value={form.tax_class}
              onChange={(v) => set("tax_class", v)}
              options={[
                { value: "",  label: "Select…"  },
                { value: "1", label: "I"         },
                { value: "2", label: "II"        },
                { value: "3", label: "III"       },
                { value: "4", label: "IV"        },
                { value: "5", label: "V"         },
                { value: "6", label: "VI"        },
              ]}
            />
          </Field>

          <Field label="Krankenversicherung">
            <Input
              value={form.health_insurance}
              onChange={(v) => set("health_insurance", v)}
              placeholder="TK – Techniker Krankenkasse"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 4: Emergency contact ────────────────────── */}
      <Section title="Emergency contact">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name">
            <Input
              value={form.emergency_contact_name}
              onChange={(v) => set("emergency_contact_name", v)}
              placeholder="Max Mustermann"
            />
          </Field>

          <Field label="Phone">
            <Input
              type="tel"
              value={form.emergency_contact_phone}
              onChange={(v) => set("emergency_contact_phone", v)}
              placeholder="+49 151 12345678"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 5: Equipment ─────────────────────────────── */}
      <Section title="Equipment">
        <Field label="Assigned equipment">
          <textarea
            value={form.equipment_assigned}
            onChange={(e) => set("equipment_assigned", e.target.value)}
            placeholder="MacBook Pro 16&quot;, iPhone 14, YubiKey…"
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 transition-all duration-150"
          />
        </Field>
      </Section>

      {/* ── Submit bar ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? "Saving…" : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">
        {label}
        {required && <span className="text-brand-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  disabled,
  min,
  max,
  step,
  title,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  step?: string;
  title?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      title={title}
      className="w-full h-10 px-3.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 transition-all duration-150 appearance-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-zinc-800">
          {o.label}
        </option>
      ))}
    </select>
  );
}
