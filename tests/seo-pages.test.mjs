import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const indexPage = read('src/pages/ogren/index.astro');
const detailPage = read('src/pages/ogren/[slug].astro');
const config = read('astro.config.mjs');
const pricing = read('src/pages/fiyatlandirma.astro');
const download = read('src/pages/indir.astro');
const blog = read('src/pages/blog/index.astro');
const seoDoc = read('docs/v2/SEO.md');

test('retired mini lessons forward to the level test and leave the sitemap', () => {
  for (const page of [indexPage, detailPage]) assert.match(page, /Astro\.redirect\('\/seviye-testi', 301\)/);
  assert.doesNotMatch(config, /\/ogren/);
  assert.doesNotMatch(config, /customPages:[\s\S]*dashboard/);
});

test('launch copy is honest about beta pricing and unverified download metadata', () => {
  assert.doesNotMatch(pricing, /Stripe|Iyzico|checkout|7 Gün Ücretsiz Dene|trial|disabled/i);
  assert.match(pricing, /her şey ücretsiz/i);
  assert.match(pricing, /Premium/);
  assert.match(pricing, /iletişim|\/iletisim/i);

  assert.doesNotMatch(download, /fetch\('\/api\/apk-version'\)|~ver|checksum/i);
  assert.match(download, /new URL\('\/api\/apk-version'/);
  assert.match(download, /doğrulanamadı|yayın metadatası alınamadı|checksum bilgisi/i);

  assert.match(blog, /href="\/seviye-testi"/);
  assert.match(blog, /ders önizlemeleri|mini dersler|Öğrenme yolu/i);
});

test('SEO documentation records researched rules and authored counts', () => {
  assert.match(seoDoc, /newly authored lessons:\s*6/i);
  assert.match(seoDoc, /practice questions:\s*25/i);
  assert.match(seoDoc, /pending independent ESL QA/i);
  assert.match(seoDoc, /developers\.google\.com\/search\/docs\/crawling-indexing\/consolidate-duplicate-urls/);
  assert.match(seoDoc, /developers\.google\.com\/search\/docs\/crawling-indexing\/sitemaps\/build-sitemap/);
  assert.match(seoDoc, /developers\.google\.com\/search\/docs\/appearance\/structured-data\/sd-policies/);
  assert.match(seoDoc, /schema\.org\/LearningResource/);
  assert.match(seoDoc, /teachingenglish\.org\.uk/);
});
