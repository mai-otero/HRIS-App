import { redirect } from "next/navigation";

// Root route — middleware handles auth redirect,
// but as a fallback we push straight to dashboard.
export default function Home() {
  redirect("/dashboard");
}
