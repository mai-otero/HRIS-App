"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/lib/types";

interface Props {
  profile: Profile;
  signOutAction: () => Promise<void>;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function DashboardIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function PayrollIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function PTOIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

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

export default function AppSidebar({ profile, signOutAction }: Props) {
  const pathname = usePathname();
  const isAdmin = profile.role === "admin";
  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
    isAdmin
      ? { label: "Employees",  href: "/employees", icon: <UsersIcon /> }
      : { label: "My Profile", href: `/employees/${profile.id}`, icon: <UserIcon /> },
    { label: "Payroll", href: "/payroll", icon: <PayrollIcon /> },
    { label: "PTO",     href: "/pto",     icon: <PTOIcon /> },
  ];

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-zinc-900 border-r border-white/[0.06] h-full">

      {/* Brand */}
      <div className="py-3 px-4 flex items-center gap-2.5 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 via-indigo-400 to-sky-400 flex items-center justify-center select-none shrink-0">
          <span className="text-white font-bold text-[11px] leading-none tracking-wide">SS</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm leading-tight tracking-tight truncate bg-gradient-to-r from-pink-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
            Supersonio
          </span>
          <span className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest leading-tight">
            People Ops
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-2.5 py-2 rounded-lg text-sm font-medium
              transition-colors duration-100
              ${isActive(item.href)
                ? "bg-brand-400/[0.12] text-brand-400 border-l-[3px] border-brand-400 pl-[0.5rem] pr-2.5"
                : "px-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }
            `}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGradient(profile.full_name)} flex items-center justify-center shrink-0`}>
            <span className="text-xs font-medium text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">
              {profile.full_name ?? "—"}
            </p>
            <p className="text-xs text-zinc-500 capitalize">{profile.role}</p>
          </div>
        </div>
        <form action={signOutAction} className="w-full">
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
