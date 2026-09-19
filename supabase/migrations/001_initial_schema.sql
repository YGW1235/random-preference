create extension if not exists pgcrypto;

create table if not exists public.weekly_topics (
  id uuid primary key default gen_random_uuid(),
  option_a text not null check (char_length(trim(option_a)) between 1 and 120),
  option_b text not null check (char_length(trim(option_b)) between 1 and 120),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint weekly_topics_valid_period check (ends_at > starts_at),
  constraint weekly_topics_distinct_options check (lower(trim(option_a)) <> lower(trim(option_b))),
  constraint weekly_topics_unique_start unique (starts_at)
);

create index if not exists weekly_topics_active_idx
  on public.weekly_topics (starts_at desc, ends_at);

create table if not exists public.weekly_votes (
  id bigint generated always as identity primary key,
  topic_id uuid not null references public.weekly_topics(id) on delete cascade,
  voter_id uuid not null,
  choice text not null check (choice in ('a', 'b')),
  created_at timestamptz not null default now(),
  constraint weekly_votes_one_per_voter unique (topic_id, voter_id)
);

create index if not exists weekly_votes_topic_choice_idx
  on public.weekly_votes (topic_id, choice);

alter table public.weekly_topics enable row level security;
alter table public.weekly_votes enable row level security;

-- No public table policies on purpose. The Next.js server uses the service role key.

create or replace function public.cast_weekly_vote(
  p_topic_id uuid,
  p_voter_id uuid,
  p_choice text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_starts_at timestamptz;
  v_ends_at timestamptz;
begin
  if p_choice not in ('a', 'b') then
    raise exception 'INVALID_CHOICE';
  end if;

  select starts_at, ends_at
    into v_starts_at, v_ends_at
  from public.weekly_topics
  where id = p_topic_id;

  if not found then
    raise exception 'TOPIC_NOT_FOUND';
  end if;

  if now() < v_starts_at or now() >= v_ends_at then
    raise exception 'VOTING_CLOSED';
  end if;

  insert into public.weekly_votes (topic_id, voter_id, choice)
  values (p_topic_id, p_voter_id, p_choice);
end;
$$;

revoke all on function public.cast_weekly_vote(uuid, uuid, text) from public;
revoke all on function public.cast_weekly_vote(uuid, uuid, text) from anon;
revoke all on function public.cast_weekly_vote(uuid, uuid, text) from authenticated;
grant execute on function public.cast_weekly_vote(uuid, uuid, text) to service_role;

create or replace function public.get_finished_topic_results()
returns table (
  id uuid,
  option_a text,
  option_b text,
  starts_at timestamptz,
  ends_at timestamptz,
  votes_a bigint,
  votes_b bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    t.id,
    t.option_a,
    t.option_b,
    t.starts_at,
    t.ends_at,
    count(v.id) filter (where v.choice = 'a') as votes_a,
    count(v.id) filter (where v.choice = 'b') as votes_b
  from public.weekly_topics t
  left join public.weekly_votes v on v.topic_id = t.id
  where t.ends_at <= now()
  group by t.id, t.option_a, t.option_b, t.starts_at, t.ends_at
  order by t.starts_at desc;
$$;

revoke all on function public.get_finished_topic_results() from public;
revoke all on function public.get_finished_topic_results() from anon;
revoke all on function public.get_finished_topic_results() from authenticated;
grant execute on function public.get_finished_topic_results() to service_role;
