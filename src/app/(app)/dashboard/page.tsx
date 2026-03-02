import { requireProfile } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
        Good to see you, {firstName}
      </h1>
      <p className="text-zinc-400 text-sm mb-10">
        {profile.role === "admin"
          ? "Here's an overview of your team."
          : "Here's your personal overview."}
      </p>

      {/* Placeholder cards — will be filled in Steps 5–7 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
        {profile.role === "admin" ? (
          <>
            <DashCard label="Employees" href="/employees" />
            <DashCard label="Payroll"   href="/payroll"   />
            <DashCard label="PTO"       href="/pto"       />
          </>
        ) : (
          <>
            <DashCard label="My Profile" href={`/employees/${profile.id}`} />
            <DashCard label="Payroll"    href="/payroll" />
            <DashCard label="PTO"        href="/pto"     />
          </>
        )}
      </div>
    </div>
  );
}

function DashCard({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="block bg-zinc-900 rounded-xl ring-1 ring-white/[0.06] px-5 py-4
                 hover:ring-white/[0.12] hover:bg-zinc-800/50 transition-all"
    >
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="text-xs text-zinc-500 mt-0.5">View →</p>
    </Link>
  );
}
