-- Dynamic UTC-week seed data. Safe for a fresh development database.
with bounds as (
  select (date_trunc('week', timezone('UTC', now())) at time zone 'UTC') as this_monday
)
insert into public.weekly_topics (
  option_a,
  option_b,
  option_a_image_url,
  option_b_image_url,
  starts_at,
  ends_at
)
select
  'Coffee',
  'Tea',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1800&q=85',
  this_monday,
  this_monday + interval '7 days'
from bounds
on conflict (starts_at) do update set
  option_a = excluded.option_a,
  option_b = excluded.option_b,
  option_a_image_url = excluded.option_a_image_url,
  option_b_image_url = excluded.option_b_image_url;

with bounds as (
  select (date_trunc('week', timezone('UTC', now())) at time zone 'UTC') as this_monday
)
insert into public.weekly_topics (
  option_a,
  option_b,
  option_a_image_url,
  option_b_image_url,
  starts_at,
  ends_at
)
select
  'Sunrise',
  'Sunset',
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1800&q=85',
  this_monday - interval '7 days',
  this_monday
from bounds
on conflict (starts_at) do update set
  option_a = excluded.option_a,
  option_b = excluded.option_b,
  option_a_image_url = excluded.option_a_image_url,
  option_b_image_url = excluded.option_b_image_url;

with bounds as (
  select (date_trunc('week', timezone('UTC', now())) at time zone 'UTC') as this_monday
)
insert into public.weekly_topics (
  option_a,
  option_b,
  option_a_image_url,
  option_b_image_url,
  starts_at,
  ends_at
)
select
  'City',
  'Countryside',
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85',
  this_monday - interval '14 days',
  this_monday - interval '7 days'
from bounds
on conflict (starts_at) do update set
  option_a = excluded.option_a,
  option_b = excluded.option_b,
  option_a_image_url = excluded.option_a_image_url,
  option_b_image_url = excluded.option_b_image_url;

-- Add deterministic-looking sample vote volume to the two finished topics.
insert into public.weekly_votes (topic_id, voter_id, choice)
select t.id, gen_random_uuid(), case when g <= 57 then 'a' else 'b' end
from public.weekly_topics t
cross join generate_series(1, 100) g
where t.option_a = 'Sunrise' and t.ends_at <= now()
on conflict do nothing;

insert into public.weekly_votes (topic_id, voter_id, choice)
select t.id, gen_random_uuid(), case when g <= 41 then 'a' else 'b' end
from public.weekly_topics t
cross join generate_series(1, 100) g
where t.option_a = 'City' and t.ends_at <= now()
on conflict do nothing;
