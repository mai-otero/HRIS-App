import LoginForm from "./LoginForm";
import type { ReactNode } from "react";

// searchParams is a Promise in Next.js 15
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // Only import dev-only modules in development so they never appear in the
  // production module graph or server-action manifest.
  let devContent: ReactNode = null;
  if (process.env.NODE_ENV === "development") {
    const [{ default: DevLoginForm }, { devSignIn }] = await Promise.all([
      import("./DevLoginForm"),
      import("./actions"),
    ]);
    devContent = <DevLoginForm action={devSignIn} />;
  }

  return (
    <LoginForm authError={error}>
      {devContent}
    </LoginForm>
  );
}
