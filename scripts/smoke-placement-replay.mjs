import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import stored from '../src/data/placement-question-pool.json' with { type: 'json' };
import { createPlacementState, recordPlacementAnswer, selectNextPlacementQuestion } from '../src/lib/placement-test.mjs';

const base = process.env.PLACEMENT_SMOKE_BASE || 'http://127.0.0.1:4321';
const response = await fetch(`${base}/api/placement/pool?v=3`);
assert.equal(response.status, 200);
const pool = await response.json();
assert.ok(pool.questions.every(question => !Object.hasOwn(question, 'answer')), 'public pool has no answer keys');
// Fixtures use checked-in keys; the browser must grade against the real API.
const first = stored.questions[0];
const variant = stored.questions.find(q => q.contentKey === first.contentKey && q.id !== first.id);
const choice = q => ({ id: q.id, selectedIndex: q.answer });
const oneAnswer = recordPlacementAnswer(createPlacementState(), first, true, first.answer);
let complete = createPlacementState();
while (!complete.completed) {
  const question = selectNextPlacementQuestion({ state: complete, pool: stored.questions });
  complete = recordPlacementAnswer(complete, question, true, question.answer);
}
const extra = stored.questions.find(q => !complete.questions.some(row => row.id === q.id));
const cases = [
  { name: 'malformed-rows', answers: [null, false, {}, { id: 'missing', selectedIndex: 0 }, choice(first)], expected: oneAnswer },
  { name: 'out-of-range-choices', answers: [-1, first.options.length, 1.5, '0', null].map(selectedIndex => ({ id: first.id, selectedIndex })), expected: createPlacementState() },
  { name: 'duplicate-variants', answers: [choice(first), choice(first), choice(variant)], expected: oneAnswer },
  { name: 'post-completion', answers: [...complete.questions, choice(extra)], expected: complete },
  { name: 'corrupt-json', raw: '{broken', expected: createPlacementState() },
];
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const results = [];
try {
  for (const width of [1440, 390]) {
    for (const scenario of cases) {
      const context = await browser.createBrowserContext();
      try {
        const page = await context.newPage();
        await page.setViewport({ width, height: 950 });
        await page.setBypassServiceWorker(true);
        await page.setCacheEnabled(false);
        const errors = [];
        const interceptedSaves = [];
        const checks = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.setRequestInterception(true);
        page.on('request', request => {
          const path = new URL(request.url()).pathname;
          if (path === '/api/placement/check') checks.push(JSON.parse(request.postData()));
          if (path !== '/api/placement/save') return void request.continue();
          interceptedSaves.push(JSON.parse(request.postData()));
          // Explicit persistence test double: never write real learner progress.
          void request.respond({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
        });
        await page.evaluateOnNewDocument(raw => localStorage.setItem('languago:placement-draft', raw),
          scenario.raw || JSON.stringify({ learnerName: 'Alex', goal: 'general', answers: scenario.answers }));
        assert.equal((await page.goto(base, { waitUntil: 'networkidle2', timeout: 60_000 })).status(), 200);
        const corrupt = scenario.name === 'corrupt-json';
        if (corrupt) {
          assert.equal(await page.$eval('#placement-resume', el => el.hidden), true);
          assert.equal(await page.evaluate(() => localStorage.getItem('languago:placement-draft')), null);
          await page.type('#placement-name', 'Alex');
        }
        const action = corrupt ? '#placement-start' : '#placement-resume';
        await page.waitForSelector(action, { visible: true });
        await page.focus(action);
        await page.keyboard.press('Enter');
        if (scenario.expected.completed) {
          await page.waitForSelector('#placement-result', { visible: true, timeout: 120_000 });
          await page.waitForFunction(() => document.querySelector('#placement-save').textContent.includes('Sonuç kaydedildi'));
          assert.deepEqual(interceptedSaves, [{ learnerName: 'Alex', goal: 'general', answers: complete.questions }]);
          assert.ok((await page.$eval('#placement-result-copy', el => el.textContent)).startsWith(`${complete.questions.length} genel İngilizce sorusunda`));
          assert.equal(await page.evaluate(() => localStorage.getItem('languago:placement-draft')), null);
        } else {
          const next = selectNextPlacementQuestion({ state: scenario.expected, pool: pool.questions });
          await page.waitForSelector('#placement-options button:not(:disabled)', { visible: true, timeout: 60_000 });
          assert.equal(await page.$eval('#placement-step', el => el.textContent), `Soru ${scenario.expected.questions.length + 1}`);
          assert.equal(await page.$eval('#placement-question', el => el.textContent), next.prompt);
          assert.equal(await page.evaluate(() => document.activeElement.id), next.source === 'reading' ? 'placement-passage-label' : 'placement-question');
          if (!corrupt) {
            assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('languago:placement-draft')).answers), scenario.expected.questions);
          }
          assert.equal(interceptedSaves.length, 0);
        }
        assert.deepEqual(checks, scenario.expected.questions.map(({ id, selectedIndex }) => ({ id, selectedIndex })), 'only valid unique tasks reach the real checker');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
        results.push({ width, mode: scenario.name, status: 'pass', answers: scenario.expected.questions.length, checkedAnswers: checks.length, interceptedSaves: interceptedSaves.length, consoleErrors: errors.length });
      } finally { await context.close(); }
    }
  }
  console.log(JSON.stringify({ base, poolTotal: pool.total, results, realSaveRequests: 0 }, null, 2));
} finally { await browser.close(); }
