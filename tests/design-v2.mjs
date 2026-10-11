import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const layout = read('src/layouts/Layout.astro');
const appLayout = read('src/layouts/AppLayout.astro');
const globalCss = read('src/styles/global.css');
const home = read('src/pages/index.astro');
const learningPath = read('src/lib/learning-path.ts');

assert.match(layout, /class="skip-link"\s+href="#main-content"/, 'public layout exposes a skip link');
assert.match(appLayout, /class="skip-link"\s+href="#app-content"/, 'app layout exposes a skip link');
assert.doesNotMatch(appLayout, /<main[^>]*>\s*<slot\s*\/>\s*<\/main>/s, 'app layout must not wrap page <main> landmarks inside another <main>');
assert.match(appLayout, /<nav[^>]+aria-label="Öğrenme alanları"/s, 'app layout has an accessible replacement nav for mobile and desktop app navigation');
assert.match(globalCss, /:focus-visible/, 'global focus-visible styles are defined');
assert.match(globalCss, /prefers-reduced-motion:\s*reduce/, 'reduced-motion preference is respected');
assert.match(globalCss, /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s, 'native hidden state cannot be overridden by component display rules');
assert.doesNotMatch(globalCss, /nav\.site a\.nav\s*\{[^}]*display:\s*none/s, 'public nav links are not hidden on mobile without a replacement');

assert.doesNotMatch(layout + home, /https:\/\/(instagram|x|discord|youtube)\.com/, 'placeholder social destinations are hidden/removed');
assert.doesNotMatch(home + layout, /Temel öğretmen/i, 'misleading Temel öğretmen copy is removed');
// Languago 2.0 homepage (SiteLayout): honest, accessible, both tracks visible.
const siteLayout = read('src/layouts/SiteLayout.astro');
const siteCss = read('src/styles/site.css');
assert.match(siteLayout, /class="skip"\s+href="#main"/, 'new public layout exposes a skip link');
assert.match(siteCss, /prefers-reduced-motion:\s*reduce/, 'new site respects reduced motion');
assert.match(home, /href="\/signup\?rol=ogretmen"/, 'homepage visibly offers the teacher track');
assert.match(home, /href="\/signup"/, 'homepage has a primary student CTA');
assert.match(home, /<section[^>]+id="classroom-games"[\s\S]*?href="\/sinif-oyunlari"/, 'homepage links the classroom games hub');
assert.match(home, /class="soon">Yakında/, 'features from later releases are marked Yakında, not promised as live');

// The old /dashboard pages now forward to /app (Languago 2.0).
for (const p of ['dashboard/index', 'dashboard/dilbilgisi', 'dashboard/okuma', 'dashboard/kelimeler']) {
  assert.match(read(`src/pages/${p}.astro`), /Astro\.redirect\('\/app/, `${p} forwards to the new app`);
}

assert.doesNotMatch(learningPath, /!\s*;/, 'learning-path helpers do not use unsafe non-null assertions');
assert.match(learningPath, /SkillKey \| string|undefined/, 'learning-path helpers accept unfinished/unimplemented keys safely');
assert.match(learningPath, /fallbackSkill|return null|return undefined/, 'learning-path helpers expose a safe fallback for unknown keys');

assert.match(read('src/pages/dashboard/oyunlar/index.astro'), /Astro\.redirect\('\/app\/kelime\/oyun/, 'old games forward to the new word games');
assert.ok(existsSync(join(root, 'src/components/LearningPath.astro')), 'LearningPath reusable component exists');
assert.ok(existsSync(join(root, 'src/components/LearningGuideCard.astro')), 'LearningGuideCard reusable component exists');
assert.ok(existsSync(join(root, 'src/components/MobileAppNav.astro')), 'MobileAppNav reusable component exists');
assert.ok(existsSync(join(root, 'docs/v2/DESIGN.md')), 'V2 design documentation exists');
console.log('design-v2 checks passed');
