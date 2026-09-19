-- Public, narrowly-scoped RPC surface for the anonymous weekly vote app.
-- Tables remain protected by RLS; anon can only execute these validated functions.

drop function if exists public.cast_weekly_vote(uuid,uuid,text);
drop function if exists public.get_finished_topic_results();
drop function if exists public.get_active_topic();
drop function if exists public.get_voter_state(uuid,uuid);

create function public.get_active_topic()
returns table (
  id uuid,
  option_a text,
  option_b text,
  option_a_image_url text,
  option_b_image_url text,
  starts_at timestamptz,
  ends_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.option_a, t.option_b, t.option_a_image_url, t.option_b_image_url, t.starts_at, t.ends_at
  from public.weekly_topics t
  where t.starts_at <= now() and t.ends_at > now()
  order by t.starts_at desc
  limit 1;
$$;

create function public.get_voter_state(p_topic_id uuid, p_voter_id uuid)
returns table (choice text, votes_a bigint, votes_b bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select v.choice
    from public.weekly_votes v
    where v.topic_id = p_topic_id and v.voter_id = p_voter_id
    limit 1
  )
  select mine.choice,
         count(v.id) filter (where v.choice = 'a') as votes_a,
         count(v.id) filter (where v.choice = 'b') as votes_b
  from mine
  left join public.weekly_votes v on v.topic_id = p_topic_id
  group by mine.choice;
$$;

create function public.cast_weekly_vote(p_topic_id uuid, p_voter_id uuid, p_choice text)
returns table (choice text, votes_a bigint, votes_b bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_starts_at timestamptz;
  v_ends_at timestamptz;
begin
  if p_choice not in ('a', 'b') then raise exception 'INVALID_CHOICE'; end if;

  select t.starts_at, t.ends_at into v_starts_at, v_ends_at
  from public.weekly_topics t where t.id = p_topic_id;

  if not found then raise exception 'TOPIC_NOT_FOUND'; end if;
  if now() < v_starts_at or now() >= v_ends_at then raise exception 'VOTING_CLOSED'; end if;

  insert into public.weekly_votes(topic_id, voter_id, choice)
  values (p_topic_id, p_voter_id, p_choice)
  on conflict (topic_id, voter_id) do nothing;

  return query
  select mine.choice,
         count(v.id) filter (where v.choice = 'a') as votes_a,
         count(v.id) filter (where v.choice = 'b') as votes_b
  from (
    select v0.choice from public.weekly_votes v0
    where v0.topic_id = p_topic_id and v0.voter_id = p_voter_id limit 1
  ) mine
  left join public.weekly_votes v on v.topic_id = p_topic_id
  group by mine.choice;
end;
$$;

create function public.get_finished_topic_results()
returns table (
  id uuid, option_a text, option_b text,
  option_a_image_url text, option_b_image_url text,
  starts_at timestamptz, ends_at timestamptz,
  votes_a bigint, votes_b bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id,t.option_a,t.option_b,t.option_a_image_url,t.option_b_image_url,t.starts_at,t.ends_at,
         count(v.id) filter (where v.choice='a') as votes_a,
         count(v.id) filter (where v.choice='b') as votes_b
  from public.weekly_topics t
  left join public.weekly_votes v on v.topic_id=t.id
  where t.ends_at <= now()
  group by t.id,t.option_a,t.option_b,t.option_a_image_url,t.option_b_image_url,t.starts_at,t.ends_at
  order by t.starts_at desc;
$$;

revoke execute on function public.get_active_topic() from public, authenticated;
revoke execute on function public.get_voter_state(uuid,uuid) from public, authenticated;
revoke execute on function public.cast_weekly_vote(uuid,uuid,text) from public, authenticated;
revoke execute on function public.get_finished_topic_results() from public, authenticated;

grant execute on function public.get_active_topic() to anon, service_role;
grant execute on function public.get_voter_state(uuid,uuid) to anon, service_role;
grant execute on function public.cast_weekly_vote(uuid,uuid,text) to anon, service_role;
grant execute on function public.get_finished_topic_results() to anon, service_role;
