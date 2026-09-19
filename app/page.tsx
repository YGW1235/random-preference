import { cookies } from "next/headers";
import { VotingScreen } from "@/components/VotingScreen";
import { getActiveTopic, getTopicResultForVoter, getVoteForVoter } from "@/lib/topics";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const topic = await getActiveTopic();

  if (!topic) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#f3efe6] px-6 text-center text-black">
        <div className="text-[11px] font-semibold tracking-[0.18em] uppercase">random.preference</div>
        <h1 className="mt-8 text-5xl font-semibold tracking-[-0.05em] md:text-7xl">No question this week.</h1>
        <p className="mt-5 max-w-md text-sm text-black/50">A new preference will appear here when the next weekly topic starts.</p>
      </main>
    );
  }

  const cookieStore = await cookies();
  const rawVoterId = cookieStore.get("rp_voter_id")?.value ?? null;
  const voterId = rawVoterId && isUuid(rawVoterId) ? rawVoterId : null;
  const initialChoice = voterId ? await getVoteForVoter(topic.id, voterId) : null;
  const initialResult = initialChoice && voterId ? await getTopicResultForVoter(topic.id, voterId) : null;

  return <VotingScreen topic={topic} initialChoice={initialChoice} initialResult={initialResult} />;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
