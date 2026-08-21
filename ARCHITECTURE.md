# Architecture

## Overview

```

<domain>  →  Caddy (HTTPS / reverse proxy, auto-certs)
                 ├── Astro SSR (Node)   →  site, auth, dashboard, games, SEO pages
                 └── Jitsi Meet         →  video classroom (same VPS)

student browser
  ├── Supabase Auth (email/password)
  └── Supabase Postgres  →  profiles, class_roster, student_progress, lessons
```

## Repo layout

```
languago-platform/
├── README.md / DECISIONS.md / ARCHITECTURE.md / PLAN.md
├── package.json                # Astro SSR (node adapter)
├── astro.config.mjs            # SSR + output, site URL, sitemap
├── .env.example                # SUPABASE_URL, SUPABASE_ANON_KEY
├── supabase/
│   └── schema.sql              # profiles, class_roster, student_progress, lessons
└── src/
    ├── layouts/                # base + auth layouts (SEO meta in <head>)
    ├── pages/
    │   ├── index.astro         # landing/home (SEO content)
    │   ├── signup.astro        # student sign-up
    │   ├── signin.astro        # student/teacher sign-in
    │   ├── dashboard/index.astro   # protected student dashboard
    │   └── sitemap.xml.ts      # generated sitemap
    ├── lib/
    │   └── supabase.ts         # SSR client (createServerClient w/ cookies)
    ├── actions/                # signup/signin/signout Astro actions
    └── components/
        ├── Games/              # in-class game islands
        └── Study/              # vocab/grammar/reading modules (port from Lingo)
```

## Data model (Supabase Postgres)

See `supabase/schema.sql`. Core tables:

- `profiles` — id (auth.users FK), role (`student`|`teacher`), name, level, created_at
- `class_roster` — teacher_id → student_ids, class name, join_code
- `student_progress` — student_id + module + position + srs_state (JSONB) + updated_at
- `lessons` — scheduled lessons: teacher_id, title, starts_at, room token (Jitsi)

RLS: students read/write only their own rows; teacher reads roster they own.

## Auth flow (SSR, cookie-based)

1. Sign-up/sign-in form → Astro action → `supabase.auth.signUp/signInWithPassword`
2. Session stored in HTTP-only cookie via `@supabase/ssr` createServerClient
3. Protected routes check the session server-side and redirect to `/signin` if missing.

## SEO

- Per-page `<title>` + meta description + OG/Twitter tags (Layout)
- `sitemap.xml.ts` generated from pages
- `robots.txt` static
- JSON-LD: EducationalOrganization / Teacher schema on landing
- Astro static rendering for content pages; islands only for interactive parts

## Testing

- `.test/smoke.js` — jsdom headless test of routes/auth/rendering (mirrors Languago
  pattern). Run: `cd .test && npm install && node smoke.js`