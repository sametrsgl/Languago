import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const base = process.env.PLACEMENT_SMOKE_BASE || 'http://127.0.0.1:4321';
const response = await fetch(`${base}/api/placement/pool?v=2`);
assert.equal(response.status, 200);
const pool = await response.json();
assert.equal(pool.questions.length, pool.total);
const readings = pool.questions.filter((question) => question.source === 'reading');
const passageFor = (question) => pool.passages?.[question.sourceId.replace(/-\d+$/, '')];
for (const question of readings) assert.ok(passageFor(question)?.text?.trim(), `${question.id}: missing passage`);
const first = readings.find((question) => question.level === 'A1');
const second = readings.find((question) => question.level === 'A1' && question.sourceId.replace(/-\d+$/, '') !== first.sourceId.replace(/-\d+$/, ''));
const grammar = pool.questions.find((question) => question.source === 'grammar' && question.level === 'A2');
const long = readings.find((question) => question.level === 'C2' && passageFor(question).text.includes('\n\n'));
assert.ok(first && second && grammar && long);
// These explicit fixtures contain unchanged records/text from the target API.
// They make reading, passage changes and a grammar transition reachable without
// manufacturing learner evidence or writing to the result-save API.
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const results = [];
async function activate(page, selector) {
  await page.focus(selector);
  await page.keyboard.press('Enter');
}
async function assertReading(page, question) {
  await page.waitForFunction((prompt) => document.querySelector('#placement-question')?.textContent === prompt, {}, question.prompt);
  const expected = passageFor(question);
  const view = await page.evaluate(() => {
    const passage = document.querySelector('#placement-passage');
    return { hidden: passage.hidden, title: document.querySelector('#placement-passage-title').textContent,
      paragraphs: [...document.querySelectorAll('#placement-passage-text p')].map((p) => p.textContent),
      focus: document.activeElement.id, lang: document.querySelector('#placement-passage-text').lang,
      labelledBy: passage.getAttribute('aria-labelledby'), overflow: document.documentElement.scrollWidth > innerWidth };
  });
  assert.equal(view.hidden, false);
  assert.equal(view.title, expected.title);
  assert.deepEqual(view.paragraphs, expected.text.split(/\r?\n\s*\r?\n/));
  assert.equal(view.focus, 'placement-passage-label');
  assert.equal(view.lang, 'en');
  assert.equal(view.labelledBy, 'placement-passage-label');
  assert.equal(view.overflow, false);
}
try {
  for (const width of [1440, 390]) {
    for (const mode of ['full-pool-reading', 'reading-resume-grammar', 'long-reading', 'missing-context-retry']) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width, height: 950 });
      await page.setBypassServiceWorker(true);
      await page.setCacheEnabled(false);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      let requests = 0;
      let saveRequests = 0;
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const route = new URL(request.url()).pathname;
        if (route === '/api/placement/save') { saveRequests += 1; return void request.abort(); }
        if (route !== '/api/placement/pool') return void request.continue();
        requests += 1;
        if (mode === 'full-pool-reading') return void request.continue();
        const questions = mode === 'long-reading' ? [long] : [first, second, grammar];
        const passages = mode === 'missing-context-retry' && requests === 1 ? {} : pool.passages;
        void request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ questions, passages }) });
      });
      assert.equal((await page.goto(base, { waitUntil: 'networkidle2', timeout: 60_000 })).status(), 200);
      await activate(page, '#placement-start');
      if (mode === 'full-pool-reading') {
        let reachedReading = false;
        for (let step = 0; step < 24; step += 1) {
          await page.waitForSelector('#placement-options button:not(:disabled)', { visible: true });
          const prompt = await page.$eval('#placement-question', (el) => el.textContent);
          const level = await page.$eval('#placement-current', (el) => el.textContent);
          const question = pool.questions.find((item) => item.prompt === prompt && item.level === level);
          assert.ok(question, 'visible question must be in the real pool');
          if (question.source === 'reading') {
            await assertReading(page, question);
            reachedReading = true;
            break;
          }
          await activate(page, `#placement-options button:nth-child(${question.answer + 1})`);
          await activate(page, '#placement-next');
        }
        assert.ok(reachedReading, 'an all-correct full-pool attempt must reach reading');
      } else if (mode === 'missing-context-retry') {
        await page.waitForFunction(() => document.querySelector('#placement-load-error')?.textContent.includes('okuma metinleri'));
        const failure = await page.evaluate(() => ({
          visible: document.querySelector('#placement-load-error').getBoundingClientRect().height > 0,
          role: document.querySelector('#placement-load-error').getAttribute('role'),
          testHidden: document.querySelector('#placement-test').hidden,
          resultHidden: document.querySelector('#placement-result').hidden,
          disabled: document.querySelector('#placement-start').disabled,
          draft: localStorage.getItem('languago:placement-draft'),
        }));
        assert.deepEqual(failure, { visible: true, role: 'alert', testHidden: true, resultHidden: true, disabled: false, draft: null });
        await activate(page, '#placement-start');
        await assertReading(page, first);
        assert.equal(await page.$eval('#placement-load-error', (el) => el.textContent), '');
      } else if (mode === 'long-reading') {
        await assertReading(page, long);
      } else {
        await assertReading(page, first);
        await activate(page, `#placement-options button:nth-child(${first.answer + 1})`);
        await activate(page, '#placement-next');
        await assertReading(page, second);
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForSelector('#placement-resume', { visible: true });
        await activate(page, '#placement-resume');
        await assertReading(page, second);
        await activate(page, `#placement-options button:nth-child(${second.answer + 1})`);
        await activate(page, '#placement-next');
        assert.equal(await page.$eval('#placement-question', (el) => el.textContent), grammar.prompt);
        assert.equal(await page.$eval('#placement-passage', (el) => el.hidden), true);
        assert.equal(await page.$eval('#placement-passage-text', (el) => el.textContent), '');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'placement-question');
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(saveRequests, 0, 'smoke tests must not save learner results');
      assert.deepEqual(errors, []);
      results.push({ width, mode, status: 'pass', requests, saveRequests, consoleErrors: errors.length });
      await context.close();
    }
  }
  console.log(JSON.stringify({ base, poolTotal: pool.total, readingsWithContext: readings.length, passages: Object.keys(pool.passages).length, results }, null, 2));
} finally { await browser.close(); }
