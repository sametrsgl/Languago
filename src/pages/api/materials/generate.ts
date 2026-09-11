import type { APIRoute } from 'astro';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseFragment, serialize } from 'parse5';
import { getSessionUser } from '../../../lib/auth';
import { pageCookieSource } from '../../../lib/supabase';

// Material Maker — LLM-driven printable ESL material generator (PUBLIC route).
// Flow: validate → call an OpenAI-compatible chat endpoint → wrap the returned
// body-only HTML in a branded print template (Kommo logo + Languago wordmark)
// → render HTML→PDF with puppeteer-core + @sparticuz/chromium → stream PDF.
export const prerender = false;

const MAX_TOPIC_LENGTH = 400;
const MAX_DURATION_LENGTH = 60;
const MAX_REQUEST_BYTES = 4096;
const MAX_PAGES = 6;
const LLM_TIMEOUT_MS = 180_000;
const PDF_TIMEOUT_MS = 60_000;

// Strict payload allowlists — the public form only offers these values, so
// anything else is rejected instead of being passed to the prompt.
const ALLOWED_LEVELS = new Set([
  'A1', 'A2', 'B1', 'B2', 'C1', 'C2',
  'IELTS', 'TOEFL', 'YDS', 'PTE', 'Üniversite Proficiency',
]);

// ---------------------------------------------------------------------------
// Anonymous abuse throttling (best-effort, in-memory per server instance).
// A durable limiter needs shared state (Upstash/KV); until that infra exists
// this still cuts casual abuse on warm instances and every response carries
// explicit rate-limit headers so honest clients can back off.
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX = 5;              // generations…
const RATE_LIMIT_WINDOW_MS = 10 * 60_000; // …per 10 minutes per client
const rateBuckets = new Map<string, number[]>();

function clientKey(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterSec: number; remaining: number } {
  const now = Date.now();
  const bucket = (rateBuckets.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (bucket.length >= RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - bucket[0]);
    rateBuckets.set(key, bucket);
    // Opportunistic cleanup so the map cannot grow unbounded.
    if (rateBuckets.size > 5000) {
      for (const [k, v] of rateBuckets) {
        if (!v.some((t) => now - t < RATE_LIMIT_WINDOW_MS)) rateBuckets.delete(k);
      }
    }
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      remaining: 0,
    };
  }
  bucket.push(now);
  rateBuckets.set(key, bucket);
  return { allowed: true, retryAfterSec: 0, remaining: RATE_LIMIT_MAX - bucket.length };
}

// Verbatim material-maker system prompt (see MATERIAL_MAKER.md).
const SYSTEM_PROMPT = `You are Languago's "Material Maker" — an expert English (ESL/EFL) materials designer.

You ONLY create English-teaching materials. If the request is NOT a request to make
teaching material (e.g. general chat, code, math, translations, personal advice), reply
with exactly: "Languago Material Maker only creates English teaching materials." and stop.

When the request IS a material request, produce a complete, print-ready HTML document.
Return ONLY the HTML body — no markdown fences, no code block, no commentary.

HTML RULES (strict):
- Use ONLY these tags: h1, h2, h3, p, ul, ol, li, table, thead, tbody, tr, th, td,
  blockquote, strong, em, section. No <div>, no inline styles, no <head>, no <style>,
  no <script>, no custom classes other than the ones named below.
- Numbered items MUST be an <ol> with <li> children. Never type numbers like "1." yourself.
- Single column only. No two-column layouts, no floats, no nested boxes.
- A blank for the student is written inline as "____" (four underscores).
- Caution box: &lt;blockquote class="caution"&gt;⚠️ CAUTION: …(wrong → correct, NO checkmarks) — use ✗ for wrong, → for correct&lt;/blockquote&gt;
- Key trap: &lt;blockquote class="trap"&gt;🚫 KEY TRAP: …(NO checkmarks — use ✗ → correct)&lt;/blockquote&gt;
- Each exercise is a <section class="part"> with an <h2> heading.

WORKSHEET / HOMEWORK / QUIZ STRUCTURE — follow this order exactly:
1. <h1>{Title}</h1>, then <p class="meta">Topic: {topic} | Score: ____ / 30</p>
2. <section class="part"><h2>📖 Part 1 — {Grammar / language focus}</h2>
   A short table (rule + example) plus ONE <blockquote class="caution"> showing the most
   common mistake in a "WRONG → CORRECT" format (no checkmarks; use ✗ for wrong, → for correct).</section>
3. <section class="part"><h2>✍️ Part 2 — {Controlled practice}</h2>
   An <ol> of 10 gap-fill sentences. State the points in the heading, e.g. "(10 points — 1 each)".</section>
4. <section class="part"><h2>📖 Part 3 — {Reading}</h2>
   One coherent passage wrapped in <section class="reading"> … </section> (A1–B1 ≈ 120–180
   words, B2–C2 ≈ 200–260 words; academic context for B1+, daily-life for A1–A2),
   followed by an <ol> of 4–5 comprehension questions.</section>
5. <section class="part"><h2>🎯 Part 4 — {Semi-controlled}</h2>
   An <ol> of 6–8 error-correction or sentence-transformation items, plus ONE
   <blockquote class="trap"> for a high-frequency mistake.</section>
6. <section class="part"><h2>✍️ Part 5 — {Free production}</h2>
   A short writing task (2–4 prompts) using the target language.</section>
7. <section class="answer-key"><h2>ANSWER KEY</h2>
   Answers grouped by part — each part is an <h3> followed by an <ol>. Answer marks
   (✓ / answers) appear ONLY inside this section; the student parts have none.</section>

CONTENT RULES:
- Correct, level-appropriate English. Academic/university contexts for B1+; daily-life
  contexts for A1–A2.
- VOCABULARY BY LEVEL (strict):
  • A1–A2: high-frequency everyday words (wake up, breakfast, school, family, home).
  • B1: university/college contexts — lecture, assignment, thesis, research, seminar,
    department, scholarship, laboratory, experiment, analysis, professor, campus,
    internship, CV, module, tutorial, deadline, presentation, peer review, citation.
  • B2: advanced academic — hypothesis, methodology, phenomenon, curriculum,
    pedagogy, assessment, rubric, competency, interdisciplinary, empirical,
    convention, synthesis, annotation, bibliography, discourse, rationale, paradigm.
  • C1–C2: research-level — epistemology, hermeneutics, dialectic, praxis,
    ontological, methodological, axiomatic, heuristic, substantiation,
    hermeneutic, exegesis, phenomenology, dialectical, axiological.
- Context examples by topic:
  • Past tenses (B1): \"While the research assistant was analysing the data, the professor entered the lab...\"
  • Past tenses (B2): \"During the lecture, the visiting scholar was presenting her doctoral research when the fire alarm interrupted the symposium...\"
- Split the 30 points across the parts and state the points in each part's heading.
- MCQ questions (if any): 3 plausible distractors + 1 correct answer, labelled a/b/c/d.
- A word bank, if used, is a single compact <p> (words separated by commas, no definitions).

SPEAKING CLUB (only when the requested type is "Speaking Club"):
- Timed, activity-based, in this order: WARM-UP → Language focus → Controlled →
  Semi-controlled → Free practice → Wrap-up. State a time for each activity. Not a gap-fill sheet.`;

type MaterialType = 'worksheet' | 'homework' | 'speaking' | 'quiz';

const TYPE_LABELS: Record<MaterialType, string> = {
  worksheet: 'Çalışma Kağıdı',
  homework: 'Ödev',
  speaking: 'Speaking Club',
  quiz: 'Quiz',
};

const TYPE_FILE_TAGS: Record<MaterialType, string> = {
  worksheet: 'Calisma_Kagidi',
  homework: 'Odev',
  speaking: 'Speaking_Club',
  quiz: 'Quiz',
};

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function normalizeType(value: unknown): MaterialType {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (['calisma-kagidi', 'calisma kagidi', 'çalışma kağıdı', 'çalışma kagidi', 'worksheet'].includes(v)) return 'worksheet';
  if (['odev', 'ödev', 'homework'].includes(v)) return 'homework';
  if (['speaking', 'speaking club', 'speaking-club', 'konusma kulubu', 'konuşma kulübü'].includes(v)) return 'speaking';
  if (['quiz', 'test'].includes(v)) return 'quiz';
  return 'worksheet';
}

function slugify(value: string): string {
  const trMap: Record<string, string> = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
  };
  return value
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => trMap[c] ?? c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildUserPrompt(input: {
  type: MaterialType;
  level: string;
  topic: string;
  pages: number;
  duration?: string;
}): string {
  const lines = [
    'Material request:',
    `- Type: ${TYPE_LABELS[input.type]}`,
    `- Level: ${input.level || 'Not specified'}`,
    `- Topic / request: ${input.topic}`,
    `- Target length: ${input.pages} page(s)`,
  ];
  if (input.type === 'speaking' && input.duration) {
    lines.push(`- Duration: ${input.duration}`);
  }
  lines.push('', 'Produce the complete, print-ready HTML body now.');
  return lines.join('\n');
}

// Strip a wrapping ```html ... ``` fence if the model adds one anyway.
function cleanHtml(raw: string): string {
  let s = raw.trim();
  const fence = /^```(?:html)?\s*([\s\S]*?)\s*```$/i;
  const match = s.match(fence);
  if (match) s = match[1].trim();
  return s;
}

function isRefusal(content: string): boolean {
  return /Languago Material Maker only creates English teaching materials/i.test(content);
}

// ---------------------------------------------------------------------------
// MODEL-HTML SANITIZER (allowlist). The LLM is prompted to emit a tiny tag
// set, but prompts are not security boundaries: sanitize everything it
// returns BEFORE the HTML is rendered by Chromium.
//
// Blocks: <script>/<style> blocks, <iframe>/<object>/<embed>/<link>/<meta>,
// event-handler attributes, javascript:/vbscript:/data: URLs, ALL src/href
// attributes (remote + data resources), inline style attributes, HTML
// comments, and any tag outside the allowlist. Only a validated `class`
// attribute survives.
// ---------------------------------------------------------------------------
const ALLOWED_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'blockquote', 'strong', 'em', 'b', 'i', 'u', 'section',
  'br', 'hr', 'span',
]);
const SAFE_CLASS_RE = /^[a-zA-Z0-9 _-]{1,80}$/;

async function sanitizeModelHtml(raw: string): Promise<string> {
  const ALLOWED_TAGS = new Set([
    'h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'table', 'thead', 'tbody',
    'tfoot', 'tr', 'th', 'td', 'blockquote', 'strong', 'em', 'b', 'i', 'u',
    'section', 'br', 'hr', 'span',
  ]);
  const fragment = parseFragment(raw) as any;
  const visit = (node: any): string => {
    if (node.nodeName === '#text') return serialize(node);
    if (node.nodeName === '#comment') return '';
    const tag = String(node.tagName || '').toLowerCase();
    const children = (node.childNodes ?? []).map(visit).join('');
    if (!ALLOWED_TAGS.has(tag)) return children;
    const classAttr = (node.attrs ?? []).find((attr: any) => attr.name === 'class');
    const cls = typeof classAttr?.value === 'string' ? classAttr.value.trim() : '';
    const safeClass = cls && SAFE_CLASS_RE.test(cls) ? ` class="${cls}"` : '';
    return `<${tag}${safeClass}>${children}</${tag}>`;
  };
  return (fragment.childNodes ?? []).map(visit).join('');
}

// The LLM rarely applies our `.answer-key` class, so the answer key ends up
// split across pages (a few lines at the bottom of one page, the rest on the
// next). Force it onto its own page: find the heading that introduces it and
// wrap it — plus everything after it — in a page-break section.
function forceAnswerKeyPageBreak(bodyHtml: string): string {
  const re = /<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(bodyHtml))) {
    if (/answer\s*key/i.test(m[2])) {
      const idx = m.index;
      return (
        bodyHtml.slice(0, idx) +
        '<section class="answer-key" style="page-break-before:always;break-before:page;">' +
        bodyHtml.slice(idx) +
        '</section>'
      );
    }
  }
  return bodyHtml;
}

async function callLLM(input: {
  baseUrl: string;
  apiKey: string;
  model: string;
  userPrompt: string;
}): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetch(`${input.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: input.userPrompt },
        ],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`LLM HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content.trim() : '';
  } finally {
    clearTimeout(timer);
  }
}

// Inline the Kommo logo as a base64 data URL so the PDF render has zero network
// dependency. A self-referential fetch of the site's own /mascot.png fails inside
// the Vercel function (leaving a broken-image icon), so we read a bundled/local
// copy from disk instead and only fall back to the origin URL if that's missing.
async function resolveLogoDataUrl(baseOrigin: string): Promise<string> {
  const local = path.join(process.cwd(), 'public', 'mascot.png');
  if (existsSync(local)) {
    try {
      return `data:image/png;base64,${readFileSync(local).toString('base64')}`;
    } catch {
      // fall through to the URL
    }
  }
  return `${baseOrigin}/mascot.png`;
}

function buildDocument(input: {
  bodyHtml: string;
  title: string;
  logoUrl: string;
  baseUrl: string;
}): string {
  const { bodyHtml, title, logoUrl, baseUrl } = input;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<base href="${baseUrl}" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 24mm 16mm 16mm 16mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif;
    color: #1f2937;
    font-size: 11pt;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .mm-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 20mm;
    padding: 5mm 16mm 0;
    background: #ffffff;
    border-bottom: 3px solid #0d9488;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .mm-header img {
    width: 12mm;
    height: 12mm;
    object-fit: contain;
    border-radius: 6px;
    flex: 0 0 auto;
  }
  .mm-header .mm-wordmark {
    font-weight: 800;
    font-size: 13pt;
    color: #0f766e;
    letter-spacing: -0.01em;
  }
  .mm-header .mm-title {
    font-size: 9.5pt;
    color: #4b5563;
    margin-left: auto;
    text-align: right;
  }
  .mm-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 13mm;
    padding: 3mm 16mm 0;
    background: #ffffff;
    border-top: 2px solid #0d9488;
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 8.5pt;
    color: #0f766e;
    font-weight: 700;
  }
  .mm-footer img {
    width: 7mm;
    height: 7mm;
    object-fit: contain;
    border-radius: 4px;
  }
  .mm-content {
    padding: 0;
  }
  .mm-content h1 {
    font-size: 19pt;
    color: #0f766e;
    border-bottom: 2px solid #0d9488;
    padding-bottom: 6px;
    margin: 0 0 12px;
    page-break-after: avoid;
    break-after: avoid;
  }
  .mm-content h2 {
    font-size: 14.5pt;
    color: #0d9488;
    margin: 16px 0 8px;
    page-break-after: avoid;
    break-after: avoid;
  }
  .mm-content h3, .mm-content h4 {
    font-size: 12pt;
    color: #1f2937;
    margin: 12px 0 6px;
    page-break-after: avoid;
    break-after: avoid;
  }
  .mm-content p { margin: 5px 0; }
  .mm-content ul, .mm-content ol { margin: 6px 0 12px; padding-left: 22px; }
  .mm-content li { margin: 4px 0; }
  .mm-content strong { color: #0f766e; }
  .mm-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .mm-content th, .mm-content td {
    border: 1px solid #e5e7eb;
    padding: 6px 9px;
    text-align: left;
    vertical-align: top;
  }
  .mm-content th { background: #ccfbf1; color: #0f766e; }
  .mm-content blockquote {
    border-left: 4px solid #f59e0b;
    background: #fff7ed;
    margin: 10px 0;
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .mm-content blockquote.trap {
    border-left-color: #dc2626;
    background: #fef2f2;
  }
  .mm-content .meta {
    color: #4b5563;
    font-size: 10pt;
    margin: 0 0 14px;
  }
  .mm-content .part {
    margin: 0 0 12px;
  }
  .mm-content .reading {
    font-size: 10.5pt;
    line-height: 1.6;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 8px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .mm-content p, .mm-content li {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .mm-content .answer-key,
  .mm-content .mm-answer-key {
    page-break-before: always;
    break-before: page;
  }
</style>
</head>
<body>
  <header class="mm-header">
    <img src="${logoUrl}" alt="Languago" />
    <span class="mm-wordmark">Languago</span>
    <span class="mm-title">${escapeHtml(title)}</span>
  </header>
  <main class="mm-content">${bodyHtml}</main>
  <footer class="mm-footer">
    <img src="${logoUrl}" alt="Languago" />
    <span>Languago · ${escapeHtml(title)}</span>
  </footer>
</body>
</html>`;
}

function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.NETLIFY
  );
}

function resolveLocalChrome(): string | undefined {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ].filter((c): c is string => Boolean(c));

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

async function renderPdf(html: string): Promise<Buffer> {
  let browser;
  if (isServerlessRuntime()) {
    browser = await puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
      defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });
  } else {
    const executablePath = resolveLocalChrome();
    if (!executablePath) {
      throw new Error('local-chrome-not-found');
    }
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 1 },
    });
  }

  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on('request', (request) => request.abort());
    await page.setContent(html, { waitUntil: 'load', timeout: PDF_TIMEOUT_MS });
    await page.emulateMediaType('print');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getSessionUser(pageCookieSource({ request, cookies }));
  if (!user) return jsonError(401, 'Oturum açman gerekiyor.');

  // Best-effort anonymous throttle FIRST — the LLM call is the expensive part.
  const rl = checkRateLimit(clientKey(request));
  const antiAbuseHeaders: Record<string, string> = {
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
    'X-RateLimit-Remaining': String(Math.max(0, rl.remaining)),
    'X-RateLimit-Window-Seconds': String(RATE_LIMIT_WINDOW_MS / 1000),
  };
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({
        error: `Çok fazla materyal isteği gönderdin. Lütfen ${Math.ceil(rl.retryAfterSec / 60)} dakika sonra tekrar dene.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Retry-After': String(rl.retryAfterSec),
          ...antiAbuseHeaders,
        },
      }
    );
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) return jsonError(413, 'İstek gövdesi çok büyük.');

  let body: Record<string, unknown> = {};
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return jsonError(413, 'İstek gövdesi çok büyük.');
    }
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return jsonError(400, 'Geçersiz istek. Lütfen tekrar dene.');
  }

  // Reject payloads that are not plain objects (arrays/strings/null).
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError(400, 'Geçersiz istek. Lütfen tekrar dene.');
  }

  const type = normalizeType(body.type);
  const level = typeof body.level === 'string' ? body.level.trim() : '';
  const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
  const pagesRaw = typeof body.pages === 'number' ? body.pages : Number.parseInt(String(body.pages ?? ''), 10);
  const pages = Number.isFinite(pagesRaw) && pagesRaw > 0 ? Math.min(Math.round(pagesRaw), MAX_PAGES) : 2;
  const duration = typeof body.duration === 'string' ? body.duration.trim() : '';

  if (!topic) {
    return jsonError(400, 'Konu / istek alanı boş olamaz. Lütfen üretmek istediğin materyali yaz.');
  }
  if (topic.length > MAX_TOPIC_LENGTH) {
    return jsonError(400, `Konu çok uzun. En fazla ${MAX_TOPIC_LENGTH} karakter kullanabilirsin.`);
  }
  // Strict level allowlist — matches the options the public form offers.
  if (!ALLOWED_LEVELS.has(level)) {
    return jsonError(400, 'Geçersiz seviye seçimi. Lütfen listeden bir seviye seç.');
  }
  if (type === 'speaking' && duration.length > MAX_DURATION_LENGTH) {
    return jsonError(400, `Süre alanı çok uzun. En fazla ${MAX_DURATION_LENGTH} karakter kullanabilirsin.`);
  }

  const baseUrl = (import.meta.env.LLM_BASE_URL || 'https://opencode.ai/zen/go/v1').replace(/\/+$/, '');
  const apiKey = import.meta.env.LLM_API_KEY;
  const model = import.meta.env.LLM_MODEL || 'deepseek-v4-pro';

  if (!apiKey) {
    return jsonError(500, 'Materyal üretici şu anda yapılandırılmamış. Lütfen daha sonra tekrar dene.');
  }

  let rawHtml: string;
  try {
    rawHtml = await callLLM({
      baseUrl,
      apiKey,
      model,
      userPrompt: buildUserPrompt({ type, level, topic, pages, duration }),
    });
  } catch {
    return jsonError(502, 'Yapay zekâ yanıtı alınamadı. Lütfen birkaç dakika sonra tekrar dene.');
  }

  const html = await sanitizeModelHtml(cleanHtml(rawHtml));
  if (!html) {
    return jsonError(502, 'Yapay zekâ içerik üretemedi. Lütfen tekrar dene.');
  }

  // Strip any checkmark/✓ marks from the student version body (they belong
  // only in the ANSWER KEY section). Split at the answer-key heading and
  // only sanitize the student portion.
  const answerKeyMatch = html.match(/<h[1-4][^>]*>\s*[A]NSWER\s+[K]EY[\s\S]*$/i);
  const answerKeyIdx = answerKeyMatch ? html.indexOf(answerKeyMatch[0]) : -1;
  let bodyHtml: string;
  if (answerKeyIdx > 0) {
    const studentPart = html.slice(0, answerKeyIdx);
    const keyPart = html.slice(answerKeyIdx);
    bodyHtml = studentPart.replace(/[✓✔√]/g, '') + keyPart;
  } else {
    bodyHtml = html.replace(/[✓✔√]/g, '');
  }

  if (isRefusal(bodyHtml)) {
    return jsonError(400, 'Languago Materyal Üretici yalnızca İngilizce öğretim materyali üretir. Lütfen bir materyal isteği yaz.');
  }

  const origin = new URL(request.url).origin;
  const logoUrl = await resolveLogoDataUrl(origin);
  const title = `${TYPE_LABELS[type]} — ${level || 'Genel'}`;
  const fullHtml = buildDocument({
    bodyHtml: forceAnswerKeyPageBreak(bodyHtml),
    title,
    logoUrl,
    baseUrl: `${origin}/`,
  });

  let pdf: Buffer;
  try {
    pdf = await renderPdf(fullHtml);
  } catch {
    return jsonError(500, 'PDF oluşturulurken bir hata oluştu. Lütfen tekrar dene.');
  }

  const filename = `Languago_${slugify(topic) || 'materyal'}_${TYPE_FILE_TAGS[type]}.pdf`;
  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      ...antiAbuseHeaders,
    },
  });
};
