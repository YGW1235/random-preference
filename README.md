# random.preference

One question. Two choices. Every week.

## Product scope

The product intentionally stays small:

- `/` — one full-screen weekly A/B vote
- `/history` — finished questions with their opened image split and separate result stats
- no accounts, comments, profiles, rankings, feeds, or admin UI

## Current interaction

- Both choice images are always rendered at full viewport size.
- Before voting, each image is masked to 50% of the viewport.
- After voting, only the mask/divider moves; the images themselves do not resize.
- The visual split is capped at 20/80 so the losing option remains readable, while displayed percentages remain exact.
- Desktop reveals left/right; mobile reveals top/bottom.
- Results remain hidden until the browser has voted on the active topic.
- One browser vote per weekly topic is enforced with an HTTP-only anonymous UUID cookie plus a database unique constraint.

## Stack

- Next.js 16 / App Router / TypeScript
- React 19
- Tailwind CSS 4
- Supabase Postgres + optional Supabase Storage
- Vercel

## Supabase setup

Create a Supabase project, then run these SQL files in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_add_topic_images.sql`
3. `supabase/migrations/003_topic_images_storage.sql
4. `004_public_rpc_api.sql`` — recommended; creates the public `topic-images` bucket

For local/demo content only, optionally run:

- `supabase/seed.sql`

The tables have RLS enabled with no public read/write policies. The application accesses them only from the Next.js server using the service-role key.

## Image workflow

Upload the two weekly images in Supabase Dashboard → Storage → `topic-images`.

Recommended source image:

- landscape, roughly 3:2
- at least ~2000 px wide
- main subject near the center because `background-size: cover` crops differently across desktop and mobile
- WebP/JPEG preferred
- under 10 MB (the storage bucket enforces this)

Copy each file's public URL into the topic row. If an image URL is missing or fails to load, the UI still has a color fallback.

## Add next week's topic

Use `supabase/add-topic.example.sql`. It automatically schedules the next UTC Monday-to-Monday week; replace only the two labels and two image URLs.

Example public Storage URL:

```text
https://YOUR_PROJECT.supabase.co/storage/v1/object/public/topic-images/summer.webp
```

## Local setup

No environment variables are required for the current build. The Supabase project URL and publishable key are safe-to-expose values and are pinned in `lib/supabase/server.ts`; all tables remain protected by RLS and only the narrow anonymous RPC surface is executable.

```bash
npm install
npm run typecheck
npm run lint
npm run dev
```

## Vercel deployment

Deploy the repository as a standard Next.js project. No Vercel environment variables are required for this version. The canonical site URL is pinned to `https://random.preference.com` for metadata, `robots.txt`, and `sitemap.xml`.

After deployment, connect `random.preference.com` in Vercel Domains and set the DNS records exactly as Vercel shows.

## Pre-launch QA

Check these once in production:

1. A fresh browser sees the active topic at 50:50 and no result numbers.
2. A vote stores successfully and reveals the result animation.
3. Refreshing keeps the same browser's choice/result and does not allow a second vote.
4. A different browser can vote independently.
5. A finished topic moves to `/history` and cannot accept new votes.
6. Extreme results show exact numbers but keep the visual image split within 20:80.
7. Desktop and mobile both keep the full image and use the correct split direction.
8. Image failure shows a fallback rather than a blank panel.
9. `/privacy`, `/robots.txt`, and `/sitemap.xml` resolve.

## Privacy

The service uses only an essential anonymous browser cookie for one-vote-per-topic behavior and includes a minimal `/privacy` page. If analytics, advertising, fingerprinting, or country-level tracking is added later, revisit the privacy/cookie setup before shipping those features.
