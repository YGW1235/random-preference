-- Replace the four values below, then run in the Supabase SQL editor.
-- This example schedules the NEXT UTC week automatically.
with bounds as (
  select
    (date_trunc('week', timezone('UTC', now())) at time zone 'UTC') + interval '7 days' as starts_at
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
  'Summer',
  'Winter',
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/topic-images/summer.webp',
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/topic-images/winter.webp',
  starts_at,
  starts_at + interval '7 days'
from bounds;
