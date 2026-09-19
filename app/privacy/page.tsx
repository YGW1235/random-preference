import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy information for random.preference.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#f4f0e8] px-5 py-8 text-[#111111] md:px-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-[11px] font-semibold tracking-[0.18em] uppercase">
            random.preference
          </Link>
          <Link href="/" className="text-[11px] font-semibold tracking-[0.18em] uppercase transition-opacity hover:opacity-50">
            Vote
          </Link>
        </div>

        <article className="mt-24 pb-20">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-black/45 uppercase">Privacy</p>
          <h1 className="mt-3 text-6xl font-semibold tracking-[-0.06em] md:text-8xl">Simple by design.</h1>
          <div className="mt-12 space-y-7 text-sm leading-7 text-black/60">
            <p>random.preference does not require an account, name, email address, or public profile to vote.</p>
            <p>
              The site stores a random identifier in an HTTP-only cookie so the same browser can cast only one vote on each weekly question. The identifier is not meant to identify you personally.
            </p>
            <p>
              Votes are stored with the weekly question, the anonymous browser identifier, the selected option, and the time of the vote. We do not use this information for advertising or cross-site tracking.
            </p>
            <p>Basic hosting and infrastructure providers may process technical request information needed to operate and secure the service.</p>
          </div>
        </article>
      </div>
    </main>
  );
}
