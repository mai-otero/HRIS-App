"use client";

import { useState } from "react";
import { sendMagicLink } from "./actions";

interface Props {
  authError?: string;
  children?: React.ReactNode;
}

export default function LoginForm({ authError, children }: Props) {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setServerError("");

    const result = await sendMagicLink(email);

    if (result.error) {
      setServerError(result.error);
      setStatus("error");
    } else {
      setStatus("success");
    }
  }

  const callbackError =
    authError === "auth_callback_failed"
      ? "This sign-in link has expired or already been used. Please request a new one."
      : authError;

  const errorText = callbackError || serverError;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4 py-16">
      <div className="w-full max-w-[420px]">

        {/* ── Wordmark ──────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2.5 mb-9">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm select-none">
            <span className="text-white font-bold text-sm leading-none">S</span>
          </div>
          <span className="text-[1.1rem] font-semibold text-white tracking-tight">
            Supersonio
          </span>
        </div>

        {/* ── Card ──────────────────────────────────────────── */}
        <div className="bg-zinc-900 rounded-2xl shadow-card ring-1 ring-white/[0.07] px-8 py-9">

          {/* Success state */}
          {status === "success" ? (
            <div className="text-center">
              <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-5">
                <svg
                  className="w-5 h-5 text-brand-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>

              <h2 className="text-[1.2rem] font-semibold text-white tracking-tight">
                Check your inbox
              </h2>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                We sent a sign-in link to{" "}
                <span className="font-medium text-zinc-200">{email}</span>.
              </p>
              <p className="text-xs text-zinc-600 mt-4 leading-relaxed">
                The link expires in 1 hour. If you don&apos;t see it, check your spam folder.
              </p>

              <button
                onClick={() => { setStatus("idle"); setEmail(""); setServerError(""); }}
                className="mt-6 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
              >
                Try a different email
              </button>
            </div>

          ) : (
            <>
              <h2 className="text-[1.35rem] font-semibold text-white tracking-tight leading-snug">
                Welcome back
              </h2>
              <p className="text-sm text-zinc-400 mt-1.5 mb-7">
                Sign in with your work email to continue.
              </p>

              {/* Error banner */}
              {errorText && (
                <div className="flex gap-3 items-start bg-red-950/60 border border-red-900/60 rounded-xl px-4 py-3.5 mb-6 text-sm text-red-400">
                  <svg
                    className="w-4 h-4 mt-0.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{errorText}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-zinc-300 mb-1.5"
                  >
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@superlist.com"
                    disabled={status === "loading"}
                    className="
                      w-full h-11 px-3.5 rounded-lg
                      bg-zinc-800 border border-zinc-700
                      text-sm text-white placeholder:text-zinc-600
                      focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600
                      disabled:opacity-50
                      transition-all duration-150
                    "
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="
                    w-full h-11 rounded-lg
                    bg-brand-600 hover:bg-brand-500
                    text-white text-sm font-medium
                    shadow-sm
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors duration-150
                  "
                >
                  {status === "loading" ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12" cy="12" r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Sending…
                    </span>
                  ) : (
                    "Continue with email"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {children}

        {/* ── Footer note ───────────────────────────────────── */}
        <p className="text-center text-xs text-zinc-700 mt-6">
          Access is restricted to Supersonio team members.
        </p>
      </div>
    </div>
  );
}
