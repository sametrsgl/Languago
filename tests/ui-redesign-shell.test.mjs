import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('public shell keeps mobile nav mobile-only, login visible, and skip link focusable', () => {
  const css = read('src/styles/global.css');
  const layout = read('src/layouts/Layout.astro');
  assert.match(css, /\.mobile-public-nav\s*\{\s*display:\s*none/);
  assert.match(css, /\.skip-link:focus/);
  assert.doesNotMatch(css, /body\s*\{[^}]*overflow-x:\s*hidden/);
  assert.match(layout, /class="btn primary cta header-login"[^>]*href="\/signin"/);
  assert.match(layout, /aria-label="Hesabına giriş yap"/);
  assert.doesNotMatch(css, /header\.site nav\.site,\s*header\.site \.cta\s*\{\s*display:\s*none/);
  assert.match(css, /header\.site \.header-login\s*\{/);
});

test('lesson explorer exposes accessible filtering controls and real links', () => {
  const page = read('src/pages/ogren/index.astro');
  assert.match(page, /type="search"/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /lesson-empty/);
  assert.match(page, /href=\{`\/ogren\/\$\{lesson\.slug\}`\}/);
  assert.match(page, /setLevel/);
});

test('auth pages retain client endpoints while using compact brand accents', () => {
  for (const file of ['src/pages/signin.astro', 'src/pages/signup.astro']) {
    const page = read(file);
    assert.match(page, /class="auth-mascot"/);
    assert.match(page, /fetch\('\/api\/auth\/(signin|signup)'/);
    assert.doesNotMatch(page, /login-side-illustration/);
  }
});
