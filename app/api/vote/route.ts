import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { castVote } from "@/lib/topics";
import type { Choice } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;

  if (origin && origin !== requestOrigin) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!isVoteBody(body)) {
    return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const rawVoterId = cookieStore.get("rp_voter_id")?.value;
  let voterId = rawVoterId && isUuid(rawVoterId) ? rawVoterId : undefined;
  const shouldSetCookie = !voterId;
  voterId ??= randomUUID();

  try {
    const vote = await castVote(body.topicId, voterId, body.choice);
    const response = NextResponse.json(vote);
    if (shouldSetCookie) setVoterCookie(response, voterId);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record vote.";
    const friendly = message.includes("VOTING_CLOSED")
      ? "Voting for this question has closed."
      : message.includes("TOPIC_NOT_FOUND")
        ? "Question not found."
        : "Unable to record vote.";
    return NextResponse.json({ error: friendly }, { status: 409 });
  }
}

function isVoteBody(value: unknown): value is { topicId: string; choice: Choice } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.topicId === "string" &&
    candidate.topicId.length > 0 &&
    (candidate.choice === "a" || candidate.choice === "b")
  );
}

function setVoterCookie(response: NextResponse, voterId: string) {
  response.cookies.set("rp_voter_id", voterId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365 * 2,
    path: "/",
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
