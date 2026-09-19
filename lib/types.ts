export type Choice = "a" | "b";

export type Topic = {
  id: string;
  option_a: string;
  option_b: string;
  option_a_image_url: string | null;
  option_b_image_url: string | null;
  starts_at: string;
  ends_at: string;
};

export type VoteResult = {
  votesA: number;
  votesB: number;
  total: number;
  percentA: number;
  percentB: number;
};

export type HistoryTopic = Topic & VoteResult;
