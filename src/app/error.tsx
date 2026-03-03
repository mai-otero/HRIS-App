"use client";

// Catches unhandled errors thrown during rendering of any route segment.
// Without this, React lets the error bubble to the root and the browser
// shows a raw "Unexpected end of JSON input" or blank white page.
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <p className="text-zinc-400 text-sm mb-4">Something went wrong loading this page.</p>
      <button
        onClick={reset}
        className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
