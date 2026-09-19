import { getSupabasePublic } from "@/lib/supabase/server";
import { calculateResult } from "@/lib/result";
import type { Choice, HistoryTopic, Topic, VoteResult } from "@/lib/types";

type HistoryResultRow = Topic & {
  votes_a: number | string | null;
  votes_b: number | string | null;
};

export async function getActiveTopic(): Promise<Topic | null> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase.rpc("get_active_topic");
  if (error) throw error;
  return (data?.[0] as Topic | undefined) ?? null;
}

export async function getVoteForVoter(
  topicId: string,
  voterId: string,
): Promise<Choice | null> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase.rpc("get_voter_state", {
    p_topic_id: topicId,
    p_voter_id: voterId,
  });
  if (error) throw error;
  return (data?.[0]?.choice as Choice | undefined) ?? null;
}

export async function getTopicResultForVoter(
  topicId: string,
  voterId: string,
): Promise<VoteResult | null> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase.rpc("get_voter_state", {
    p_topic_id: topicId,
    p_voter_id: voterId,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row?.choice) return null;
  return calculateResult(Number(row.votes_a ?? 0), Number(row.votes_b ?? 0));
}

export async function castVote(
  topicId: string,
  voterId: string,
  choice: Choice,
): Promise<{ choice: Choice; result: VoteResult }> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase.rpc("cast_weekly_vote", {
    p_topic_id: topicId,
    p_voter_id: voterId,
    p_choice: choice,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row?.choice) throw new Error("Unable to record vote.");
  return {
    choice: row.choice as Choice,
    result: calculateResult(Number(row.votes_a ?? 0), Number(row.votes_b ?? 0)),
  };
}

export async function getHistory(): Promise<HistoryTopic[]> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase.rpc("get_finished_topic_results");
  if (error) throw error;

  return (data ?? []).map((row: HistoryResultRow) => {
    const votesA = Number(row.votes_a ?? 0);
    const votesB = Number(row.votes_b ?? 0);

    return {
      id: row.id,
      option_a: row.option_a,
      option_b: row.option_b,
      option_a_image_url: row.option_a_image_url ?? null,
      option_b_image_url: row.option_b_image_url ?? null,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      ...calculateResult(votesA, votesB),
    };
  });
}
