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

## Material Maker

A public, LLM-driven material generator at `/materyal-uretici`: pick a type (worksheet,
homework, speaking-club plan, quiz), level and topic, and Languago returns a print-ready,
branded **PDF** (Kommo logo in the header + footer, on-brand teal/orange print CSS, answer
key included).

- **Page:** `src/pages/materyal-uretici.astro` (public, no auth) → `POST /api/materials/generate`
- **LLM:** an OpenAI-compatible chat endpoint, configured via env vars
- **PDF:** `puppeteer-core` + `@sparticuz/chromium` (local dev falls back to system Chrome)

Run it locally:

```bash
cp .env.example .env   # set LLM_API_KEY (and LLM_BASE_URL / LLM_MODEL if not defaulting)
npm run dev            # open http://localhost:4321/materyal-uretici
```

Requires three env vars (see below): `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`.

## Env vars (production / preview)

Set on Vercel → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `SITE_URL` | `https://www.languago.site` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `LLM_BASE_URL` | OpenAI-compatible base (default `https://opencode.ai/zen/go/v1`) |
| `LLM_MODEL` | model id (default `deepseek-v4-pro`) |
| `LLM_API_KEY` | the key for the LLM endpoint (required for Material Maker) |

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