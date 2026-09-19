"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f4f0e8] px-6 text-center text-[#111111]">
      <div className="max-w-md">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-black/45 uppercase">random.preference</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em]">Something went wrong.</h1>
        <p className="mt-5 text-sm leading-6 text-black/50">The question could not be loaded right now.</p>
        <div className="mt-8 flex items-center justify-center gap-5 text-[10px] font-semibold tracking-[0.18em] uppercase">
          <button type="button" onClick={reset} className="transition-opacity hover:opacity-50">
            Try again
          </button>
          <Link href="/history" className="transition-opacity hover:opacity-50">
            History
          </Link>
        </div>
      </div>
    </main>
  );
}
