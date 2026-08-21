# Languago Teaching Platform — Plan (rev 2: self-host + SEO)

A teaching workstation for Samet Tıraşoğlu : students sign up, log in, do
self-study, play in-class games, and take online classes with video — replacing
Google Meet with a self-hosted branded video classroom. Purpose-built to be
**cheap, fully active 24/7, and discoverable on Google**.

## Decisions (locked, rev 2)

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Astro** (static-first framework) | Renders real HTML → **indexed by Google instantly**; fast; free |
| 2 | **Deploy on Vercel free tier** (auto-deploy from GitHub, auto-HTTPS) | Web app needs no VPS; Jitsi video can be added later with its own host |
| 3 | **Supabase free tier** for auth + database | Simple; no DB server to run; free for small use |
| 4 | **Self-hosted Jitsi** (Phase 4, own VPS) for video classes | Screen share + all cameras; own URL; replaces Google Meet |
| 5 | **Custom domain** (user pays ~$10–15/yr) | Branded, and needed for Google ranking |
| 6 | **SEO baked in** — sitemap.xml, robots.txt, meta/OG tags, structured data (JSON-LD), fast load, semantic HTML | Goal: students find site when searching Google |
| 7 | **Reuse Languago content** for self-study | ~6k words + SRS + 36 grammar units + 330 reading passages already built |

## Architecture

```
student  →  https://<domain>   (Astro site, server-rendered HTML → SEO-friendly)
                │
                ├── Supabase Auth (email/password)   → student & teacher roles
                ├── Supabase Postgres                → profiles, roster, progress
                ├── Self-study modules               → vocab/grammar/reading (Lingo)
                ├── In-class games                   → hand-built JS games
                └── [Phase 4] Jitsi Meet (SELF-HOSTED, own VPS) → video classroom
```

**Hosting split:** the web app runs on **Vercel free tier**; Jitsi (Phase 4) will run on its
own VPS. Supabase stays hosted (free tier) — no DB server to run.

## SEO plan (why people find it on Google)
- Every content page is **static HTML** (Astro) — Google reads it fully.
- `sitemap.xml` + `robots.txt` submitted via Google Search Console.
- Per-page `<title>`, meta description, OG/Twitter tags.
- **JSON-LD structured data** (educational organization / teacher schema).
- Fast load (static assets, no heavy JS on content pages) — ranking factor.
- Search-friendly content pages: game library, teaching articles, level guides.

## Phases (~2 weeks)

### Phase 1 — Accounts & sign-up  (~1–2 days)
- Student sign-up/login (Supabase Auth), teacher role, roster table
- DB: `profiles`, `class_roster`, `student_progress`

### Phase 2 — Self-study area  (~2–3 days)
- Port Languago vocab/grammar/reading to web modules
- Per-student progress in Supabase; student dashboard + streak

### Phase 3 — In-class games  (~1–2 days)
- Playable JS games (spelling, quiz, word games) — teacher-led + solo

### Phase 4 — Self-hosted video classes  (~2–3 days)
- Self-host Jitsi on the VPS; "Join class" opens branded in-site room
- Schedule lesson → room link appears on student dashboard
- Replaces Google Meet

### Phase 5 — SEO + launch  (~1–2 days)
- SEO tags, sitemap, structured data, Google Search Console submission
- Domain + HTTPS, responsive QA (teacher uses iPhone 11 + Android)
- Smoke tests + deploy + report to Telegram (WhatsApp pending pairing)

**Total: ~2 weeks steady.**

## Out of scope (now)
- Payments/billing
- iOS/Android native apps (PWA web is the path)
- Multi-teacher / org billing

## Next steps
1. Settle final domain name
2. (User) create free Supabase project → share URL + keys
3. (User) provision cheap VPS + share SSH access + "range/link endpoint" to self-host Jitsi
4. Start Phase 1 (scaffold Astro + Supabase schema)
