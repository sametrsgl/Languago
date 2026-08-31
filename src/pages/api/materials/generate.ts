import type { APIRoute } from 'astro';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Material Maker — LLM-driven printable ESL material generator (PUBLIC route).
// Flow: validate → call an OpenAI-compatible chat endpoint → wrap the returned
// body-only HTML in a branded print template (Kommo logo + Languago wordmark)
// → render HTML→PDF with puppeteer-core + @sparticuz/chromium → stream PDF.
export const prerender = false;

const MAX_TOPIC_LENGTH = 400;
const LLM_TIMEOUT_MS = 60_000;
const PDF_TIMEOUT_MS = 60_000;

// Verbatim material-maker system prompt (see MATERIAL_MAKER.md).
const SYSTEM_PROMPT = `You are Languago's "Material Maker" — an expert English (ESL/EFL) materials designer.

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
- Use only the semantic HTML the template provides; do not invent a <head> or <style>.`;

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

// Resolve the Kommo logo to a URL puppeteer can load: a local file:// URL when
// public/mascot.png is on disk (local dev), else a base-URL-resolved path.
function resolveLogoUrl(baseOrigin: string): string {
  const localFile = path.join(process.cwd(), 'public', 'mascot.png');
  if (existsSync(localFile)) {
    return pathToFileURL(localFile).href;
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
  @page { size: A4; margin: 0; }
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
    padding: 24mm 16mm 16mm;
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
    try {
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: PDF_TIMEOUT_MS });
    } catch {
      // Fall back to a best-effort render even if the logo fetch stalls.
      await page.setContent(html, { waitUntil: 'load', timeout: PDF_TIMEOUT_MS });
    }
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

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, 'Geçersiz istek. Lütfen tekrar dene.');
  }

  const type = normalizeType(body.type);
  const level = typeof body.level === 'string' ? body.level.trim() : '';
  const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
  const pagesRaw = typeof body.pages === 'number' ? body.pages : Number.parseInt(String(body.pages ?? ''), 10);
  const pages = Number.isFinite(pagesRaw) && pagesRaw > 0 ? Math.min(Math.round(pagesRaw), 12) : 2;
  const duration = typeof body.duration === 'string' ? body.duration.trim() : '';

  if (!topic) {
    return jsonError(400, 'Konu / istek alanı boş olamaz. Lütfen üretmek istediğin materyali yaz.');
  }
  if (topic.length > MAX_TOPIC_LENGTH) {
    return jsonError(400, `Konu çok uzun. En fazla ${MAX_TOPIC_LENGTH} karakter kullanabilirsin.`);
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

  const html = cleanHtml(rawHtml);
  if (!html) {
    return jsonError(502, 'Yapay zekâ içerik üretemedi. Lütfen tekrar dene.');
  }

  if (isRefusal(html)) {
    return jsonError(400, 'Languago Materyal Üretici yalnızca İngilizce öğretim materyali üretir. Lütfen bir materyal isteği yaz.');
  }

  const origin = new URL(request.url).origin;
  const logoUrl = resolveLogoUrl(origin);
  const title = `${TYPE_LABELS[type]} — ${level || 'Genel'}`;
  const fullHtml = buildDocument({
    bodyHtml: html,
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
    },
  });
};
