-- Allow an anonymous browser to change its choice during the active week.
-- The unique (topic_id, voter_id) constraint remains: one voter row, latest choice wins.

create or replace function public.cast_weekly_vote(
  p_topic_id uuid,
  p_voter_id uuid,
  p_choice text
)
returns table (
  choice text,
  votes_a bigint,
  votes_b bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_starts_at timestamptz;
  v_ends_at timestamptz;
begin
  if p_choice not in ('a', 'b') then
    raise exception 'INVALID_CHOICE';
  end if;

  select t.starts_at, t.ends_at
    into v_starts_at, v_ends_at
  from public.weekly_topics t
  where t.id = p_topic_id;

  if not found then
    raise exception 'TOPIC_NOT_FOUND';
  end if;

  if now() < v_starts_at or now() >= v_ends_at then
    raise exception 'VOTING_CLOSED';
  end if;

  insert into public.weekly_votes(topic_id, voter_id, choice)
  values (p_topic_id, p_voter_id, p_choice)
  on conflict (topic_id, voter_id)
  do update
    set choice = excluded.choice
    where public.weekly_votes.choice is distinct from excluded.choice;

  return query
  select
    mine.choice,
    count(v.id) filter (where v.choice = 'a') as votes_a,
    count(v.id) filter (where v.choice = 'b') as votes_b
  from (
    select v0.choice
    from public.weekly_votes v0
    where v0.topic_id = p_topic_id and v0.voter_id = p_voter_id
    limit 1
  ) mine
  left join public.weekly_votes v on v.topic_id = p_topic_id
  group by mine.choice;
end;
$$;

revoke execute on function public.cast_weekly_vote(uuid,uuid,text) from public, authenticated;
grant execute on function public.cast_weekly_vote(uuid,uuid,text) to anon, service_role;
