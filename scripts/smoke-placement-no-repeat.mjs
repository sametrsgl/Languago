import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

// Uses the target's real API data. The variant-subset case is an explicitly
// controlled regression fixture, not a claim that production serves three items.
const base = process.env.PLACEMENT_SMOKE_BASE || 'http://127.0.0.1:4321';
const response = await fetch(`${base}/api/placement/pool`);
assert.equal(response.status, 200);
const pool = await response.json();
assert.equal(pool.questions.length, pool.total);
const original = pool.questions[0];
const copy = pool.questions.find((question) => question.sourceId === original.sourceId && question.id !== original.id);
assert.ok(copy, 'fixture needs a real option-order variant');
const fresh = pool.questions.find((question) => question.level === original.level
  && question.prompt !== original.prompt && question.id > copy.id);
assert.ok(fresh, 'fixture needs a distinct question sorted after the repeated variant');

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const results = [];
try {
  for (const width of [1440, 390]) {
    for (const mode of ['full-pool', 'real-variant-subset']) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      // Keep the app's service worker from bypassing the controlled fixture.
      await page.setBypassServiceWorker(true);
      await page.setCacheEnabled(false);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      await page.setViewport({ width, height: 950 });
      let fixtureRequests = 0;
      if (mode === 'real-variant-subset') {
        await page.setRequestInterception(true);
        page.on('request', (request) => {
          if (new URL(request.url()).pathname !== '/api/placement/pool') return void request.continue();
          fixtureRequests += 1;
          void request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ questions: [original, copy, fresh] }),
          });
        });
      }
      const home = await page.goto(base, { waitUntil: 'networkidle2', timeout: 60_000 });
      assert.equal(home.status(), 200);
      await page.focus('#placement-start');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('#placement-test').hidden);
      assert.equal(await page.$eval('#placement-question', (element) => element.textContent), original.prompt);
      await page.focus(`#placement-options button:nth-child(${(original.answer + 1) % original.options.length + 1})`);
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('#placement-next').hidden);
      await page.focus('#placement-next');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('#placement-step').textContent === 'Soru 2');
      const nextPrompt = await page.$eval('#placement-question', (element) => element.textContent);
      assert.notEqual(nextPrompt, original.prompt, `${mode}: repeated stem after answering ${original.id}`);
      if (mode === 'real-variant-subset') assert.equal(nextPrompt, fresh.prompt);

      await page.reload({ waitUntil: 'networkidle2' });
      await page.waitForSelector('#placement-resume', { visible: true });
      await page.focus('#placement-resume');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('#placement-test').hidden);
      assert.equal(await page.$eval('#placement-question', (element) => element.textContent), nextPrompt);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `${width}px viewport overflows`);
      assert.deepEqual(errors, [], 'browser console/page errors');
      if (mode === 'real-variant-subset') assert.equal(fixtureRequests, 2);
      results.push({ width, mode, poolTotal: pool.total, original: original.id,
        nextPrompt, keyboard: 'pass', resume: 'pass', overflow, errors, fixtureRequests });
      await context.close();
    }
  }
  console.log(JSON.stringify({ base, results }, null, 2));
} finally {
  await browser.close();
}
