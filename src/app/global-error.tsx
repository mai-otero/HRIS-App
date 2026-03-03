"use client";

// Catches errors that bubble past all error.tsx boundaries, including
// failures inside the root layout itself. Must render its own <html>/<body>.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white antialiased">
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <p className="text-zinc-400 text-sm mb-4">Something went wrong.</p>
          <button
            onClick={reset}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
