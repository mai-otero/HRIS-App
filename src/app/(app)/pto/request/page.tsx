import { redirect } from "next/navigation";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { submitPtoRequest } from "../actions";
import PtoRequestForm from "./PtoRequestForm";

export default async function PtoRequestPage() {
  const profile = await requireProfile();
  if (profile.role === "admin") redirect("/pto/admin");

  return (
    <div className="p-8 max-w-2xl">

      <Link
        href="/pto"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Time Off
      </Link>

      <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
        Request Time Off
      </h1>
      <p className="text-sm text-zinc-500 mb-8">
        Weekdays only — weekends and German national public holidays are excluded automatically.
      </p>

      <div className="bg-zinc-900 rounded-2xl ring-1 ring-white/[0.06] px-8 py-7">
        <PtoRequestForm action={submitPtoRequest} />
      </div>

    </div>
  );
}
