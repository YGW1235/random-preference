"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { Choice, Topic, VoteResult } from "@/lib/types";
import { formatWeekRange } from "@/lib/week";

type Props = {
  topic: Topic;
  initialChoice: Choice | null;
  initialResult: VoteResult | null;
};

type VoteResponse = {
  choice?: Choice;
  result?: VoteResult;
  error?: string;
};

const MIN_VISIBLE_SHARE = 20;
const MAX_VISIBLE_SHARE = 80;
const SPLIT_ANIMATION_MS = 3000;

export function VotingScreen({ topic, initialChoice, initialResult }: Props) {
  const [choice, setChoice] = useState<Choice | null>(initialChoice);
  const [result, setResult] = useState<VoteResult | null>(initialResult);
  const [displaySplit, setDisplaySplit] = useState(() =>
    initialResult
      ? clamp(initialResult.percentA, MIN_VISIBLE_SHARE, MAX_VISIBLE_SHARE)
      : 50,
  );
  const [pending, setPending] = useState<Choice | null>(null);
  const [animating, setAnimating] = useState(false);
  const [resultRevision, setResultRevision] = useState(0);
  const [interactionRevision, setInteractionRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revealed = Boolean(choice && result);
  const week = useMemo(() => formatWeekRange(topic.starts_at, topic.ends_at), [topic]);

  async function vote(nextChoice: Choice) {
    if (pending || animating || choice === nextChoice) return;
    setPending(nextChoice);
    setInteractionRevision((revision: number) => revision + 1);
    setError(null);

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topicId: topic.id, choice: nextChoice }),
      });
      const payload = (await response.json()) as VoteResponse;

      if (!response.ok || !payload.choice || !payload.result) {
        throw new Error(payload.error ?? "Vote failed.");
      }

      const nextSplit = clamp(
        payload.result.percentA,
        MIN_VISIBLE_SHARE,
        MAX_VISIBLE_SHARE,
      );

      setChoice(payload.choice);
      setResult(payload.result);
      setResultRevision((revision: number) => revision + 1);
      setAnimating(true);

      // Let the result state paint first, then move the existing divider/panels.
      // Two frames makes the 50:50 -> result transition reliable on first vote.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDisplaySplit(nextSplit);
        });
      });

      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      animationTimerRef.current = setTimeout(() => {
        setAnimating(false);
        animationTimerRef.current = null;
      }, SPLIT_ANIMATION_MS + 80);
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : "Vote failed.");
    } finally {
      setPending(null);
    }
  }

  const splitStyle = { "--split": `${displaySplit}%` } as CSSProperties;

  return (
    <main
      className={`voting-stage relative min-h-dvh overflow-hidden bg-[#151515] text-white ${
        revealed ? "has-result" : ""
      } ${animating ? "is-transitioning" : ""}`}
      style={splitStyle}
    >
      <div className="safe-top-nav pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 pb-5 md:px-7 md:pb-7">
        <span className="text-shadow text-[11px] font-semibold tracking-[0.18em] uppercase">
          random.preference
        </span>
        <Link
          href="/history"
          className="text-shadow pointer-events-auto text-[11px] font-semibold tracking-[0.18em] uppercase transition-opacity hover:opacity-65"
        >
          History
        </Link>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-5 z-20 hidden justify-center md:flex">
        <span className="text-shadow text-[10px] font-medium tracking-[0.16em] text-white/75 uppercase">
          {week} · UTC
        </span>
      </div>

      <section className="relative min-h-dvh">
        <PreferenceOption
          label={topic.option_a}
          imageUrl={topic.option_a_image_url}
          side="A"
          onVote={() => vote("a")}
          disabled={Boolean(pending || animating || choice === "a")}
          selected={choice === "a"}
          pending={pending === "a"}
          revealed={revealed}
          percent={result?.percentA}
          votes={result?.votesA}
          resultRevision={resultRevision}
          interactionRevision={interactionRevision}
          fallbackClass="option-fallback-a"
        />

        <PreferenceOption
          label={topic.option_b}
          imageUrl={topic.option_b_image_url}
          side="B"
          onVote={() => vote("b")}
          disabled={Boolean(pending || animating || choice === "b")}
          selected={choice === "b"}
          pending={pending === "b"}
          revealed={revealed}
          percent={result?.percentB}
          votes={result?.votesB}
          resultRevision={resultRevision}
          interactionRevision={interactionRevision}
          fallbackClass="option-fallback-b"
        />

        <div className="split-divider pointer-events-none absolute z-20" aria-hidden="true" />
      </section>

      {!revealed && !pending && (
        <div className="safe-bottom-hint pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-5 pt-5 md:px-7 md:pt-7">
          <span className="text-shadow text-[10px] font-semibold tracking-[0.18em] text-white/90 uppercase">
            Choose one
          </span>
        </div>
      )}

      {revealed && !pending && !animating && (
        <div className="safe-bottom-hint pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-5 pt-5 md:px-7 md:pt-7">
          <span className="text-shadow text-[9px] font-semibold tracking-[0.16em] text-white/60 uppercase">
            Choose the other side to change your vote
          </span>
        </div>
      )}

      {error && (
        <div className="safe-bottom-error absolute inset-x-4 bottom-0 z-40 mx-auto max-w-md rounded-full bg-white px-4 py-3 text-center text-xs font-semibold text-black shadow-xl">
          {error}
        </div>
      )}
    </main>
  );
}

function PreferenceOption({
  label,
  imageUrl,
  side,
  onVote,
  disabled,
  selected,
  pending,
  revealed,
  percent,
  votes,
  resultRevision,
  interactionRevision,
  fallbackClass,
}: {
  label: string;
  imageUrl: string | null;
  side: "A" | "B";
  onVote: () => void;
  disabled: boolean;
  selected: boolean;
  pending: boolean;
  revealed: boolean;
  percent?: number;
  votes?: number;
  resultRevision: number;
  interactionRevision: number;
  fallbackClass: string;
}) {
  const sideClass = side === "A" ? "option-panel-a" : "option-panel-b";

  return (
    <button
      type="button"
      onClick={onVote}
      disabled={disabled}
      aria-label={selected ? `${label}, your current choice` : `Vote for ${label}`}
      className={`option-panel ${sideClass} group absolute inset-0 overflow-hidden text-white ${
        disabled ? "cursor-default" : "cursor-pointer"
      } ${selected && revealed ? "is-selected" : ""} ${pending ? "is-pending" : ""}`}
    >
      <div
        className={`option-image absolute inset-0 ${fallbackClass}`}
        style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
        aria-hidden="true"
      />
      <div className="option-overlay absolute inset-0" aria-hidden="true" />
      <div className="option-vignette absolute inset-0" aria-hidden="true" />
      {pending && (
        <div
          key={`press-flash-${interactionRevision}`}
          className="option-press-flash absolute inset-0"
          aria-hidden="true"
        />
      )}
      {selected && revealed && resultRevision > 0 && (
        <div
          key={`flash-${resultRevision}`}
          className="option-choice-flash absolute inset-0"
          aria-hidden="true"
        />
      )}

      <div className={`option-content option-content-${side.toLowerCase()} absolute z-10 flex items-center justify-center`}>
        <div className="flex w-full max-w-3xl flex-col items-center px-6 py-16 text-center md:px-10">
          <div className="text-shadow mb-5 text-[10px] font-bold tracking-[0.22em] text-white/65 uppercase">
            {revealed ? (selected ? "Your choice" : "Switch vote") : side}
          </div>

          <h1 className="option-title text-shadow max-w-[15ch] text-balance text-[clamp(2.8rem,7vw,7.8rem)] leading-[0.88] font-semibold tracking-[-0.06em]">
            {label}
          </h1>

          <div className="mt-8 min-h-20">
            {pending && (
              <span className="text-shadow inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase">
                <span className="vote-dot" /> Updating
              </span>
            )}
            {revealed && !pending && (
              <div key={`result-${resultRevision}`} className="result-reveal">
                <div className="text-shadow text-[clamp(2.2rem,4vw,4.8rem)] leading-none font-semibold tracking-[-0.055em]">
                  {percent}%
                </div>
                <div className="text-shadow mt-2 text-[10px] font-semibold tracking-[0.16em] text-white/70 uppercase">
                  {(votes ?? 0).toLocaleString()} votes
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
