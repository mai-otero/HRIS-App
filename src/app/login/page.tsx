import LoginForm from "./LoginForm";
import DevLoginForm from "./DevLoginForm";
import { devSignIn } from "./actions";

// searchParams is a Promise in Next.js 15
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <LoginForm authError={error}>
      {process.env.NODE_ENV === "development" && (
        <DevLoginForm action={devSignIn} />
      )}
    </LoginForm>
  );
}
