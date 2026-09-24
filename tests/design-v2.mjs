import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const layout = read('src/layouts/Layout.astro');
const appLayout = read('src/layouts/AppLayout.astro');
const globalCss = read('src/styles/global.css');
const home = read('src/pages/index.astro');
const dashboard = read('src/pages/dashboard/index.astro');
const grammar = read('src/pages/dashboard/dilbilgisi.astro');
const reading = read('src/pages/dashboard/okuma.astro');
const games = read('src/pages/dashboard/oyunlar/index.astro');
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
assert.match(home, /href="\/ogren"[^>]*>[^<]*(Öğrenmeye başla|Öğrenme yolunu incele)/, 'homepage has a primary student CTA to /ogren');
assert.match(home, /Öğretmenim|Öğretmen akışı|Materyal üretici/i, 'homepage visibly separates teacher tools track');
assert.match(home, /A1[–-]C1[^.]{0,80}dilbilgisi|dilbilgisi[^.]{0,80}A1[–-]C1/s, 'homepage truthfully states grammar coverage as A1-C1');
assert.match(home, /C2[^.]{0,100}(okuma|metin)|sınav[^.]{0,100}(okuma|metin)/is, 'homepage truthfully states C2/exam reading coverage');
assert.match(home, /<section[^>]+id="classroom-games"[\s\S]*?Sınıf İçi Oyunlar[\s\S]*?\/sinif-oyunu[\s\S]*?Sınıf İçi Karşılaşma/, 'homepage presents a real in-class game with a working launch link');
assert.match(home, /Projektör|tahta|takım/i, 'homepage explains how the classroom game is played');
assert.match(home, /import MiniLessonPreview|<MiniLessonPreview\s*\/>/, 'homepage offers an actual interactive lesson preview');

assert.doesNotMatch(dashboard, /best|lastScore|correct|Kelime \/ Puan/, 'dashboard does not treat arbitrary game points as words');
assert.match(dashboard, /evidence\.accuracyPct|evidence\.exposure/, 'dashboard shows explicit learning evidence instead of a synthetic word count');
assert.match(dashboard, /Önerilen yol|önerilen çalışma yolu/i, 'dashboard treats the path as recommended, not mastery');
assert.doesNotMatch(dashboard, /mastery|ustalık/i, 'dashboard avoids mastery claims for flawed path data');

assert.doesNotMatch(learningPath, /!\s*;/, 'learning-path helpers do not use unsafe non-null assertions');
assert.match(learningPath, /SkillKey \| string|undefined/, 'learning-path helpers accept unfinished/unimplemented keys safely');
assert.match(learningPath, /fallbackSkill|return null|return undefined/, 'learning-path helpers expose a safe fallback for unknown keys');

for (const [name, source] of [['grammar', grammar], ['reading', reading], ['games', games]]) {
  assert.match(source, /href="\/dashboard"|href=\{`\/dashboard/s, `${name} page includes a return path to dashboard`);
  assert.match(source, /Öğrenme rehberi|Nasıl çalışılır|Rehber/i, `${name} page includes guide/help links`);
}
assert.match(games, /objective:/, 'game hub defines an objective per game');
assert.match(games, /cefr:/, 'game hub defines CEFR coverage per game');
assert.match(games, /replay:/, 'game hub defines replay guidance per game');
assert.match(games, /nextAction:/, 'game hub defines next action per game');
assert.doesNotMatch(games, /Her oyun, seçtiğin kelime setinden/, 'game hub does not claim every game is vocabulary-only');

assert.ok(existsSync(join(root, 'src/components/LearningPath.astro')), 'LearningPath reusable component exists');
assert.ok(existsSync(join(root, 'src/components/LearningGuideCard.astro')), 'LearningGuideCard reusable component exists');
assert.ok(existsSync(join(root, 'src/components/MobileAppNav.astro')), 'MobileAppNav reusable component exists');
assert.ok(existsSync(join(root, 'docs/v2/DESIGN.md')), 'V2 design documentation exists');
console.log('design-v2 checks passed');
