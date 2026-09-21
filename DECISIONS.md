# Decisions

## 2026-09-21 — Serve curated classroom questions, not synthetic practice MCQs

Reuse `buildCuratedClassTopics` on the actual SSR classroom route. Its existing unit test was passing while the page independently generated distractors from unrelated practice answers. Live inspection found 66 question sets with fewer than four options and practice-derived ambiguous alternatives. The curated bank alone preserves all 97 topics, with at least 20 distinct stems per topic for 19 question tiles. Remove the duplicate conversion instead of adding another generator/dependency. Preserve source datasets; verify the served JSON and full desktop/mobile board, including shuffled answer/explanation alignment. This structural gate is not a claim that every curated item has passed expert review.

Reference: https://www.cambridgeassessment.org.uk/blogs/writing-good-multiple-choice-questions

## 2026-09-21 — Classroom modal accessibility

Use native `dialog.showModal()` rather than a new modal dependency or hand-written focus trap. MDN's dialog guidance requires a label, initial focus, contained keyboard navigation and meaningful focus restoration. The original tile is consumed and recreated, so return focus to the next playable tile (or replay on completion). Constrain long feedback to a scrollable viewport-sized card. Preserve existing scoring and Escape semantics.

Reference: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/dialog_role


## 1. Framework — Astro (SSR) with `@astrojs/vercel`

**Decision:** build the web app on **Astro 5** in SSR mode (Vercel adapter), not a client-side
SPA (React/Vue/Svelte-only).

**Why:** every content page (game library, articles, level guides, home) must be **real HTML**
so Google indexes and ranks it — a pure JS SPA is invisible to crawlers. Astro serves
server-rendered HTML by default, is fast, free, MIT, and lets us drop in interactive islands
(games, dashboard) only where needed.

## 2. Auth & database — Supabase (free tier)

**Decision:** use **Supabase Auth** (email/password) + **Supabase Postgres** for accounts,
roster, and per-student progress.

**Why (research-first):** this is the canonical, documented path. Official Astro+Supabase
Supabase docs (`docs.astro.build/guides/backend/supabase` and
`supabase.com/docs/guides/auth/quickstarts/astrojs`) show cookie-based SSR auth with
`@supabase/ssr` + `@astrojs/vercel`. Free for small use, no DB server to run, managed. Referenced
open-source starter: `netlify-templates/astro-supabase-starter` (MIT) — we follow the docs
pattern rather than forking a stale template.

**License/recency:** Supabase OSS, actively maintained. Astro MIT, actively maintained.

## 3. Video classes — self-hosted Jitsi

**Decision:** run **Jitsi Meet** on its own VPS (Phase 4); the student dashboard's
"Join class" opens a branded in-site room (screen share + all cameras).

**Why:** user can self-host and wants to **replace Google Meet**. Jitsi is the mature
open-source (Apache 2.0) video platform doing multi-party + screen share + cameras. Self-hosting
keeps the whole thing on our hardware/data and removes third-party dependency.

## 4. Hosting — Vercel free tier (site) + VPS (Jitsi, later)

**Decision:** the web app is hosted on the **Vercel free tier** (auto-deploy from GitHub `main`,
auto-HTTPS). A dedicated VPS is deferred to Phase 4 only for the self-hosted Jitsi video server.

**Why:** Vercel's free tier handles SSR Astro, custom domain, and HTTPS with zero ops and zero
cost. Jitsi self-hosting isn't needed until video classes ship (Phase 4), so the VPS cost
(~€4–6/mo) is deferred until then.

## 5. SEO as a first-class goal

**Decision:** bake SEO in from day one — per-page `<title>`/meta/OG tags, `sitemap.xml`,
`robots.txt`, JSON-LD structured data, fast static assets, semantic HTML. Submit to Google
Search Console on launch.

**Why:** the user explicitly wants students to find the site via Google. Astro's SSR makes
this achievable without a headless CMS.

## 6. Self-study — reuse Languago content

**Decision:** port the existing Languago vocab/grammar/reading datasets (~6k words + SRS,
36 grammar units, 330 reading passages, idioms) into the web self-study modules.

**Why:** already built and tested (147 smoke tests pass). Building fresh would be strictly
worse; reuse the data, rebuild the UI for web.

## 7. In-class games — hand-built JS

**Decision:** build playable games (spelling, quiz, word games) as Astro client islands in
vanilla JS.

**Why:** zero dependency, offline-friendly, consistent with the existing Languago game
approach.

## 8. Material Maker — LLM via OpenAI-compatible endpoint + HTML→PDF via puppeteer-core + @sparticuz/chromium (research-first: Playwright's bundled Chromium exceeds Vercel's ~50MB function limit; @sparticuz/chromium is the maintained Lambda/Vercel build)