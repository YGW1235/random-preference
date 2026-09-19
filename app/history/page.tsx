import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { getHistory } from "@/lib/topics";
import { formatWeekRange } from "@/lib/week";
import type { HistoryTopic } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "History",
  description: "See how the world voted before.",
};

const MIN_VISIBLE_SHARE = 20;
const MAX_VISIBLE_SHARE = 80;

export default async function HistoryPage() {
  const history = await getHistory();

  return (
    <main className="min-h-dvh bg-[#f4f0e8] text-[#111111]">
      <header className="safe-history-header flex items-center justify-between border-b border-black/10 px-5 pb-5 md:px-8 md:pb-7">
        <Link href="/" className="text-[11px] font-semibold tracking-[0.18em] uppercase">
          random.preference
        </Link>
        <Link href="/" className="text-[11px] font-semibold tracking-[0.18em] uppercase transition-opacity hover:opacity-50">
          Vote
        </Link>
      </header>

      <section className="px-5 pt-12 pb-16 md:px-8 md:pt-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-14 md:mb-20">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-black/45 uppercase">Archive</p>
            <h1 className="mt-3 text-[clamp(3.5rem,10vw,9rem)] leading-[0.82] font-semibold tracking-[-0.065em]">History</h1>
            <p className="mt-6 max-w-md text-sm leading-6 text-black/50">Every finished question, and how the world answered.</p>
          </div>

          {history.length === 0 ? (
            <div className="border-t border-black/10 py-16 text-sm text-black/45">No finished questions yet.</div>
          ) : (
            <div className="border-t border-black/10">
              {history.map((topic, index) => (
                <HistoryResult
                  key={topic.id}
                  topic={topic}
                  indexLabel={`#${String(history.length - index).padStart(2, "0")}`}
                />
              ))}
            </div>
          )}

          <footer className="mt-14 flex justify-end border-t border-black/10 pt-6">
            <Link href="/privacy" className="text-[10px] font-semibold tracking-[0.17em] text-black/40 uppercase transition-opacity hover:opacity-60">
              Privacy
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
}

function HistoryResult({ topic, indexLabel }: { topic: HistoryTopic; indexLabel: string }) {
  const visualSplit = clamp(topic.percentA, MIN_VISIBLE_SHARE, MAX_VISIBLE_SHARE);
  const splitStyle = { "--history-split": `${visualSplit}%` } as CSSProperties;

  return (
    <article className="border-b border-black/10 py-8 md:py-12">
      <div className="mb-7 flex items-center justify-between text-[10px] font-semibold tracking-[0.17em] text-black/45 uppercase">
        <span>{formatWeekRange(topic.starts_at, topic.ends_at)}</span>
        <span>{indexLabel}</span>
      </div>

      <div className="overflow-hidden rounded-[1.4rem] border border-black/10 bg-white/45">
        <div className="history-result-stage relative aspect-[16/10] overflow-hidden bg-[#151515] md:aspect-[2/1]" style={splitStyle}>
          <HistoryImage side="A" imageUrl={topic.option_a_image_url} fallbackClass="option-fallback-a" />
          <HistoryImage side="B" imageUrl={topic.option_b_image_url} fallbackClass="option-fallback-b" />
          <div className="history-result-divider pointer-events-none absolute inset-y-0 z-20 w-px bg-white/55" aria-hidden="true" />
        </div>

        <div className="grid grid-cols-2 divide-x divide-black/10 border-t border-black/10 bg-[#f8f5ef]">
          <HistoryStat label={topic.option_a} side="A" percent={topic.percentA} votes={topic.votesA} align="left" />
          <HistoryStat label={topic.option_b} side="B" percent={topic.percentB} votes={topic.votesB} align="right" />
        </div>
      </div>
    </article>
  );
}

function HistoryImage({
  side,
  imageUrl,
  fallbackClass,
}: {
  side: "A" | "B";
  imageUrl: string | null;
  fallbackClass: string;
}) {
  return (
    <div className={`history-result-panel history-result-panel-${side.toLowerCase()} absolute inset-0 overflow-hidden`} aria-hidden="true">
      <div
        className={`history-result-image absolute inset-0 ${fallbackClass}`}
        style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
      />
      <div className="history-result-vignette absolute inset-0" />
    </div>
  );
}

function HistoryStat({
  label,
  side,
  percent,
  votes,
  align,
}: {
  label: string;
  side: "A" | "B";
  percent: number;
  votes: number;
  align: "left" | "right";
}) {
  return (
    <div className={`p-5 md:p-7 ${align === "right" ? "text-right" : "text-left"}`}>
      <div className={`flex items-start gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}>
        <span className="pt-1 text-[9px] font-bold tracking-[0.2em] text-black/35 uppercase">{side}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-balance text-[clamp(1.35rem,3vw,2.9rem)] leading-[0.95] font-semibold tracking-[-0.05em]">{label}</h2>
          <div className="mt-5 text-[clamp(2.25rem,5vw,4.8rem)] leading-none font-semibold tracking-[-0.055em]">{percent}%</div>
          <div className="mt-2 text-[9px] font-semibold tracking-[0.16em] text-black/40 uppercase">{votes.toLocaleString()} votes</div>
        </div>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
