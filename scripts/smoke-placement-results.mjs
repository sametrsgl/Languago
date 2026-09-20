import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import pool from '../src/data/placement-question-pool.json' with { type: 'json' };
import { createPlacementState, recordPlacementAnswer, selectNextPlacementQuestion } from '../src/lib/placement-test.mjs';

const base = process.env.PLACEMENT_SMOKE_BASE || 'http://127.0.0.1:4321';
// Use genuine stored questions/keys to prepare completed drafts. The browser
// must replay them against the real checker; never mock the score or pool.
let completed = createPlacementState();
while (!completed.completed) {
  const question = selectNextPlacementQuestion({ state: completed, pool: pool.questions });
  completed = recordPlacementAnswer(completed, question, true, question.answer);
}
const goals = { general: 'Genel İngilizce', ielts: 'IELTS', toefl: 'TOEFL', yds: 'YDS / YÖKDİL', other: 'Diğer sınav / hedef' };
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
});
const results = [];
try {
  for (const width of [1440, 390]) {
    for (const [goal, label] of Object.entries(goals)) {
      const context = await browser.createBrowserContext();
      try {
        const page = await context.newPage();
        await page.setViewport({ width, height: 950 });
        await page.setBypassServiceWorker(true);
        await page.setCacheEnabled(false);
        const errors = [];
        const saves = [];
        let checkedAnswers = 0;
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        page.on('response', response => {
          if (new URL(response.url()).pathname === '/api/placement/check' && response.status() === 200) checkedAnswers += 1;
        });
        await page.setRequestInterception(true);
        page.on('request', request => {
          if (new URL(request.url()).pathname !== '/api/placement/save') return void request.continue();
          saves.push(JSON.parse(request.postData()));
          // Explicit write-boundary stub: no real learner progress is saved.
          void request.respond({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
        });
        await page.evaluateOnNewDocument(draft => {
          localStorage.setItem('languago:placement-draft', JSON.stringify(draft));
        }, { learnerName: 'Alex', goal, answers: completed.questions, estimatedScore: 120, confidence: 0.99 });
        assert.equal((await page.goto(base, { waitUntil: 'networkidle2', timeout: 60_000 })).status(), 200);
        await page.waitForSelector('#placement-resume', { visible: true });
        await page.focus('#placement-resume');
        await page.keyboard.press('Enter');
        await page.waitForSelector('#placement-result', { visible: true, timeout: 120_000 });
        await page.waitForFunction(() => document.querySelector('#placement-save').textContent.includes('Sonuç kaydedildi'));
        assert.equal(checkedAnswers, completed.questions.length, 'real server answer replay');
        assert.equal(saves.length, 1);
        assert.equal(saves[0].goal, goal);
        assert.equal(saves[0].answers.length, completed.questions.length);
        assert.equal(Object.hasOwn(saves[0], 'estimatedScore'), false);
        const stats = await page.$$eval('#placement-result-stats .placement-stat', nodes => nodes.map(el => ({
          value: el.querySelector('strong').textContent, label: el.querySelector('span').textContent,
        })));
        assert.equal(stats.length, 3);
        assert.equal(stats[0].value, '100%');
        assert.equal(stats[1].value, `${completed.questions.length}/${completed.questions.length}`);
        assert.match(stats[2].value, /^(A1|A2|B1|B2|C1|C2)$/);
        assert.equal(stats[2].label, 'Başlangıç için CEFR tahmini');
        const copy = await page.$eval('#placement-result-copy', el => el.textContent);
        assert.ok(copy.includes(`Çalışma hedefin: ${label}.`));
        assert.doesNotMatch(copy, /gerçekçi|resmi sınav sonucu/);
        await page.waitForSelector('#placement-result-limitations', { visible: true });
        const limitations = await page.$eval('#placement-result-limitations', el => el.textContent);
        assert.match(limitations, /puanı üretmez/);
        assert.match(limitations, /konuşma, dinleme ve yazmayı ölçmez/);
        assert.equal(await page.$eval('#placement-result a', el => el.getAttribute('href')), '/signup?from=placement');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.focus('#placement-restart');
        await page.keyboard.press('Enter');
        await page.waitForSelector('#placement-start', { visible: true });
        assert.equal(await page.$eval('#placement-result', el => el.hidden), true);
        assert.equal(await page.evaluate(() => localStorage.getItem('languago:placement-draft')), null);
        assert.deepEqual(errors, []);
        results.push({ width, goal, status: 'pass', checkedAnswers, cefr: stats[2].value, consoleErrors: errors.length });
      } finally { await context.close(); }
    }
  }
  console.log(JSON.stringify({ base, results, realSaveRequests: 0 }, null, 2));
} finally { await browser.close(); }
