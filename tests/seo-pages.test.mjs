import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const lessons = JSON.parse(read('src/data/public-lessons.json')).lessons;
const slugs = lessons.map((lesson) => lesson.slug);

const indexPage = read('src/pages/ogren/index.astro');
const detailPage = read('src/pages/ogren/[slug].astro');
const config = read('astro.config.mjs');
const pricing = read('src/pages/fiyatlandirma.astro');
const download = read('src/pages/indir.astro');
const blog = read('src/pages/blog/index.astro');
const seoDoc = read('docs/v2/SEO.md');

test('public learn pages expose canonical metadata, prerendered routes, and visible-content JSON-LD', () => {
  assert.match(indexPage, /canonical=\{`${siteUrl}\/ogren`\}|canonical="https:\/\/www\.languago\.site\/ogren"/);
  assert.match(indexPage, /ItemList/);
  assert.match(indexPage, /itemListElement/);
  assert.doesNotMatch(indexPage, /CourseInstance|Course\"/);

  assert.match(detailPage, /export function getStaticPaths/);
  assert.match(detailPage, /canonical=\{canonical\}/);
  assert.match(detailPage, /LearningResource/);
  assert.match(detailPage, /learningResourceType/);
  assert.match(detailPage, /educationalLevel/);
  assert.doesNotMatch(detailPage, /CourseInstance|aggregateRating|reviewCount/);

  for (const slug of slugs) {
    assert.match(config, new RegExp(`\\$\\{SITE_URL\\}/ogren/${slug}`), `sitemap includes ${slug}`);
    assert.match(indexPage, new RegExp(`/ogren/${slug}`), `index links ${slug}`);
  }
  assert.match(config, /\$\{SITE_URL\}\/ogren/);
  assert.doesNotMatch(config, /customPages:[\s\S]*dashboard/);
});

test('public lesson page supports keyboard practice feedback without declaring mastery', () => {
  assert.match(detailPage, /<button[^>]+type="button"[^>]+class="option"/s);
  assert.match(detailPage, /aria-pressed/);
  assert.match(detailPage, /aria-live="polite"/);
  assert.match(detailPage, /data-correct-feedback/);
  assert.match(detailPage, /data-incorrect-feedback/);
  assert.match(detailPage, /keydown/);
  assert.match(detailPage, /Enter| /);
  assert.doesNotMatch(detailPage, /mastery|ustalık|tamamladın|konuyu bitirdin/i);
  assert.match(detailPage, /lesson\.readingText \|\| lesson\.reading/);
  assert.match(detailPage, /lesson\.nextSteps\.map/);
});

test('launch copy is honest about beta pricing and unverified download metadata', () => {
  assert.doesNotMatch(pricing, /Stripe|Iyzico|checkout|7 Gün Ücretsiz Dene|trial|disabled/i);
  assert.match(pricing, /ücretsiz beta/i);
  assert.match(pricing, /iletişim|\/iletisim/i);

  assert.doesNotMatch(download, /fetch\('\/api\/apk-version'\)|~ver|checksum/i);
  assert.match(download, /new URL\('\/api\/apk-version'/);
  assert.match(download, /doğrulanamadı|yayın metadatası alınamadı|checksum bilgisi/i);

  assert.match(blog, /href="\/ogren"|href=\{`\/ogren`\}/);
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
