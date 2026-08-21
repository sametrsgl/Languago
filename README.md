# Languago — Teaching Platform (web)

A teaching workstation for Samet Tıraşoğlu: students sign up, log in, do self-study
(vocab/grammar/reading), play in-class games, and (planned) take online classes with
video — replacing Google Meet with a branded video classroom.

Built with **Astro (SSR)** + **Supabase** + deployed on **Vercel** free tier.

## Live

- **Domain:** https://www.languago.site (also serves the redirect from languago.site)
- **Hosting:** Vercel (free Hobby plan), deployed from `main` on GitHub
- **Backend:** Supabase (Auth + Postgres) on the free tier

## Stack

- **Astro 5** — server-rendered HTML (SEO: JSON-LD / sitemap / meta tags)
- **`@astrojs/vercel`** — SSR adapter (Vercel serverless / edge functions)
- **Supabase** — Auth (email/password + email confirmation) + Postgres (profiles, roster, progress)
- **`@supabase/ssr`** — cookie-based SSR auth
- **Jitsi (planned)** — self-hosted video classroom (Phase 4; will need a VPS)

## Env vars (production / preview)

Set on Vercel → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `SITE_URL` | `https://www.languago.site` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |

## Quickstart (local)

```bash
npm install
cp .env.example .env   # SUPABASE_URL, SUPABASE_ANON_KEY
npm run dev            # local dev (http://localhost:4321)
npm run build          # production build (Vercel adapter)
npx vercel --prod      # deploy to production (needs `vercel login`)
```

## Docs

- `DECISIONS.md` — research-first verdicts + why (open-source vs in-house)
- `ARCHITECTURE.md` — components, data flow, schema
- `supabase/schema.sql` — database schema
- `PLAN.md` — phased roadmap

## Deployment

- GitHub repo: `sametrsgl/Languago` (auto-commit workflow; Vercel linked to `main`)
- Vercel: project `languago`, free Hobby plan
- Domain: `languago.site` (Namecheap), DNS CNAME `www` → Vercel

## Notes

- `.env` / `.env.local` and runtime secrets are git-ignored. Never commit keys.
- Turkish-first UI (brand is Languago); content is English-learning.
- Built to rank on Google (server-rendered HTML + sitemap + structured data).
- New student signup requires email confirmation (Supabase default).