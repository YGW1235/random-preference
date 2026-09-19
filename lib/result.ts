import type { VoteResult } from "@/lib/types";

export function calculateResult(votesA: number, votesB: number): VoteResult {
  const total = votesA + votesB;

  if (total === 0) {
    return { votesA: 0, votesB: 0, total: 0, percentA: 50, percentB: 50 };
  }

  const exactA = (votesA / total) * 100;
  const percentA = Math.round(exactA);
  const percentB = 100 - percentA;

  return { votesA, votesB, total, percentA, percentB };
}
