# Lingo Branch — Kingfish Teaching Platform (web)

A teaching workstation for Samet Tıraşoğlu (Kingfish): students sign up, log in, do
self-study (vocab/grammar/reading), play in-class games, and take online classes with
video — replacing Google Meet with a self-hosted branded video classroom.

Built with **Astro (SSR)** + **Supabase** + **self-hosted Jitsi**.

## Stack

- **Astro 5** — server-rendered HTML (JSON-LD / sitemap SEO-friendly)
- **`@astrojs/node`** — SSR adapter (self-host via Node, behind Caddy/HTTPS)
- **Supabase** — Auth (email/password) + Postgres (profiles, roster, progress)
- **Jitsi (self-hosted)** — video classroom (screen share + cameras)
- **VPS** — single box runs Astro site + Jitsi (Caddy reverse proxy, auto-HTTPS)

## Quickstart

```bash
npm install
cp .env.example .env   # SUPABASE_URL, SUPABASE_ANON_KEY
npm run dev            # local dev
npm run build && npm start   # SSR production
```

## Docs

- `DECISIONS.md` — research-first verdicts + why (open-source vs in-house)
- `ARCHITECTURE.md` — components, data flow, schema
- `supabase/schema.sql` — database schema
- `PLAN.md` — phased roadmap

## Toolchain

- Node 20+ (LTS), npm
- Free Supabase project (auth + Postgres)
- Cheap VPS (Hetzner ~€4/mo) with Docker + Caddy

## Notes

- `.env` and runtime secrets are git-ignored. Never commit keys.
- Turkish-first UI (brand is Kingfish); content is English-learning.
- CUES 24/7, and built to rank on Google (static HTML + sitemap + structured data).