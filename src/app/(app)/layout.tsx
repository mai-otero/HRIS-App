import { requireProfile } from "@/lib/auth";
import AppSidebar from "@/components/AppSidebar";
import { signOut } from "@/app/auth/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <AppSidebar profile={profile} signOutAction={signOut} />
      <div className="flex-1 overflow-y-auto min-w-0">
        {children}
      </div>
    </div>
  );
}
