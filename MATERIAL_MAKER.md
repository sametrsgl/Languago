# MATERIAL_MAKER.md — Material Maker (AI material generator)

## Goal

Add an AI-powered **Material Maker** to Languago that generates print-ready ESL teaching
materials from a natural-language request — the same way the user generates materials in
their agent chat (worksheets, homework, speaking-club plans, quizzes). Output is a branded
PDF carrying the Languago/Kommo logo. The generator is **constrained to material creation
only** (it rejects non-material requests).

## Requirements

1. **Homepage entry** — a new section on `/` (index.astro) that promotes and links to the
   Material Maker.
2. **Material Maker page** — a form-driven page where the user describes what they want.
3. **Backend** — an API route that calls an LLM to generate the material, renders it
   HTML → PDF, stamps the logo, and returns the PDF.
4. **Languago logo on every generated material** (header + footer).
5. **"Only material demands"** — the LLM is locked to a material-generator persona and
   refuses anything else.

## Interface (Turkish, matches site voice)

Route: `/materyal-uretici`

Form fields:
- **Materyal Türü** (type): `Çalışma Kağıdı` (worksheet) · `Ödev` (homework) ·
  `Speaking Club` (konuşma kulübü planı) · `Quiz`
- **Seviye** (level): A1, A2, B1, B2, C1, C2, IELTS, TOEFL, YDS, PTE, Üniversite Proficiency
- **Konu / İstek** (free text, required): e.g. "there is / there are + prepositions of place",
  "past simple", "present perfect", "comparatives"
- **Sayfa sayısı** (page count, optional, default 2)
- For Speaking Club: **süre** (duration, optional, default "2 saat")

"✨ Materyal Üret" button → calls backend → shows a "PDF'i İndir" link. Loading + error states.

## Backend — `src/pages/api/materials/generate.ts`

`POST` body: `{ type, level, topic, pages?, duration? }`

Flow:
1. Validate `topic` is non-empty and looks like a material request (short guard).
2. Build the **system prompt** (persona below) + user prompt from the fields.
3. Call an **OpenAI-compatible** chat endpoint (env-configured) → get back **HTML**.
4. Wrap the HTML in a **base print template** that injects:
   - a header with the Kommo logo (`/public/mascot.png`) + "Languago" wordmark + material title;
   - print CSS (`@page { size: A4; margin: ... }`, page-break rules, on-brand colors
     teal `#0d9488` + orange `#f59e0b`);
   - a footer with "Languago" branding.
5. Render HTML → PDF with **puppeteer-core + @sparticuz/chromium**.
6. Return `application/pdf` with `Content-Disposition: attachment` and a sensible filename
   (e.g. `Languago_<Topic>_<Type>.pdf`).

Errors → JSON `{ error }` with a clear Turkish message. Enforce a hard timeout and cap the
topic length to keep generation cheap/safe.

## Material-maker system prompt (the constraint)

```
You are Languago's "Material Maker" — an expert English (ESL/EFL) materials designer.

You ONLY create English-teaching materials. If the request is NOT a request to make
teaching material (e.g. general chat, code, math, translations, personal advice), reply
with exactly: "Languago Material Maker only creates English teaching materials." and stop.

When the request IS a material request, produce a complete, print-ready HTML document
(return only the HTML body — no markdown fences, no code block, no commentary) following
these rules:

- Correct, level-appropriate English; academic/university contexts for B1+ and
  daily-life contexts for A1–A2.
- 30-point scoring system: show "Score: ____ / 30" and split points across sections.
- Include ⚠️ CAUTION boxes and 🚫 KEY TRAP warnings for high-frequency mistakes.
- Student version must contain NO answer marks (no ✓). Put all answers in a clearly
  separated "ANSWER KEY" section at the end.
- Use emoji section markers (📖 ⚠️ 🚫 ✍️ 🎯) and clear numbered exercises.
- Speaking-club plans are timed (WARM-UP / language focus / controlled / semi-controlled /
  free practice / wrap-up) and activity-based, not a gap-fill sheet.
- Use only the semantic HTML the template provides; do not invent a <head> or <style>.
```

The backend wraps the returned HTML body in the base template (logo + print CSS), so the
LLM must return **body-only** content.

## HTML → PDF decision (research-first)

- **puppeteer-core + `@sparticuz/chromium`** (serverless Chromium). This is the canonical
  Vercel HTML→PDF path (Playwright's bundled Chromium exceeds the ~50MB function limit;
  `@sparticuz/chromium` is the maintained Lambda/Vercel build). References:
  `@sparticuz/chromium` (github), dev.to "Generate PDFs with Puppeteer on Vercel".
- Local dev: use the system Chrome/Chromium; on Vercel: `await chromium.executablePath()`.
- Set `maxDuration` (Vercel function config) to ~60s; typical render < 10s.
- `emulateMediaType('print')` before `page.pdf({ format: 'A4', printBackground: true })`.

## Languago logo

Use the existing `public/mascot.png` (Kommo, 1024×1024). In the base template, render a
small logo (`<img src="/mascot.png">`) + "Languago" wordmark in the header, and a small
logo + "Languago" line in the footer. Logo must resolve at render time (pass an absolute
`file://` or base-URL-resolved path into the page, not a relative `/mascot.png`, since
puppeteer needs a real URL).

## Env vars (add to Vercel project settings + `.env.example`)

- `LLM_BASE_URL` — OpenAI-compatible base (default `https://opencode.ai/zen/go/v1`)
- `LLM_API_KEY` — the key (do NOT commit; flag to user)
- `LLM_MODEL` — default `deepseek-v4-pro`

## Files

- `src/pages/materyal-uretici.astro` — the page + form (client island for fetch)
- `src/pages/api/materials/generate.ts` — backend
- `src/pages/index.astro` — add a homepage section + CTA
- `package.json` — add `puppeteer-core`, `@sparticuz/chromium`
- `astro.config.mjs` — Vercel function config if needed
- `.env.example` — document the three LLM vars

## Acceptance criteria

1. `npm run build` succeeds; `npm run dev` lets you generate a PDF locally (falls back to
   system Chrome).
2. Homepage shows the Material Maker section and links to `/materyal-uretici`.
3. Generating a worksheet/homework/speaking-club returns a downloadable PDF with the
   Languago/Kommo logo in header + footer.
4. A non-material prompt (e.g. "write me a python script") is rejected with the fixed
   Turkish/English refusal message and no PDF.
5. Student section has no ✓ marks; answers are in a separate ANSWER KEY section.
