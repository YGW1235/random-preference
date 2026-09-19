alter table public.weekly_topics
  add column if not exists option_a_image_url text,
  add column if not exists option_b_image_url text;

drop function if exists public.get_finished_topic_results();

create function public.get_finished_topic_results()
returns table (
  id uuid,
  option_a text,
  option_b text,
  option_a_image_url text,
  option_b_image_url text,
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
    t.option_a_image_url,
    t.option_b_image_url,
    t.starts_at,
    t.ends_at,
    count(v.id) filter (where v.choice = 'a') as votes_a,
    count(v.id) filter (where v.choice = 'b') as votes_b
  from public.weekly_topics t
  left join public.weekly_votes v on v.topic_id = t.id
  where t.ends_at <= now()
  group by
    t.id,
    t.option_a,
    t.option_b,
    t.option_a_image_url,
    t.option_b_image_url,
    t.starts_at,
    t.ends_at
  order by t.starts_at desc;
$$;

revoke all on function public.get_finished_topic_results() from public;
revoke all on function public.get_finished_topic_results() from anon;
revoke all on function public.get_finished_topic_results() from authenticated;
grant execute on function public.get_finished_topic_results() to service_role;
