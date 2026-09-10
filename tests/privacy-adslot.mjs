import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/components/AdSlot.astro', import.meta.url), 'utf8');

test('ad slot is disabled and fully hidden by default', () => {
  assert.match(source, /enabled\s*=\s*false/);
  assert.match(source, /data-ad-state=\{enabled \? 'reserved' : 'disabled'\}/);
  assert.match(source, /\.ad-slot\[data-ad-state="disabled"\]/);
  assert.match(source, /display:\s*none/);
  assert.doesNotMatch(source, /fake ad|placeholder|sponsored content/i);
});

test('enabled ad slot reserves responsive dimensions before any future load', () => {
  assert.match(source, /data-ad-state="reserved"/);
  assert.match(source, /--ad-min-height/);
  assert.match(source, /min-height:\s*var\(--ad-min-height\)/);
  assert.match(source, /@media\s*\(min-width:\s*720px\)/);
});

test('ad slot has empty and loaded states without fake provider behavior', () => {
  assert.match(source, /data-empty/);
  assert.match(source, /data-loaded/);
  assert.doesNotMatch(source, /ad_click/);
  assert.doesNotMatch(source, /adsbygoogle|googletag|doubleclick|googlesyndication/);
});

test('ad slot is labelled as advertising and documents safe placement', () => {
  assert.match(source, /aria-label=\{ariaLabel\}/);
  assert.match(source, /Reklam alanı/);
  assert.match(source, /after-learning|after-results/);
  assert.match(source, /never-between-question-answer/);
});
