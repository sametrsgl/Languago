import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import stored from '../src/data/placement-question-pool.json' with { type: 'json' };

const base = process.env.PLACEMENT_SMOKE_BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const results = [];
try {
  for (const width of [1440, 390]) {
    for (const mode of ['answer', 'resume']) {
      const context = await browser.createBrowserContext();
      try {
        const page = await context.newPage();
        await page.setViewport({ width, height: 950 });
        await page.setBypassServiceWorker(true);
        await page.setCacheEnabled(false);
        const errors = [];
        let checks = 0;
        let saves = 0;
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        await page.setRequestInterception(true);
        page.on('request', request => {
          const path = new URL(request.url()).pathname;
          if (path === '/api/placement/save') {
            saves++;
            return void request.abort();
          }
          if (path === '/api/placement/check' && ++checks === 1) {
            // Explicit fault injection; the retry uses the real grading endpoint.
            return void request.respond({ status: 200, contentType: 'application/json', body: '{"correct":"false","correctIndex":0}' });
          }
          void request.continue();
        });
        const first = stored.questions[0];
        const draft = JSON.stringify({ learnerName: 'Alex', goal: 'general', answers: [{ id: first.id, selectedIndex: first.answer }] });
        if (mode === 'resume') await page.evaluateOnNewDocument(raw => localStorage.setItem('languago:placement-draft', raw), draft);
        assert.equal((await page.goto(base, { waitUntil: 'networkidle2', timeout: 60000 })).status(), 200);
        if (mode === 'resume') {
          await page.click('#placement-resume');
          await page.waitForFunction(() => document.querySelector('#placement-load-error').textContent.includes('tekrar dene'));
          assert.equal(await page.evaluate(() => localStorage.getItem('languago:placement-draft')), draft);
          await page.click('#placement-resume');
          await page.waitForSelector('#placement-options button:not(:disabled)', { visible: true, timeout: 60000 });
          assert.equal(await page.$eval('#placement-step', el => el.textContent), 'Soru 2');
        } else {
          await page.type('#placement-name', 'Alex');
          await page.click('#placement-start');
          await page.waitForSelector('#placement-options button:not(:disabled)', { visible: true, timeout: 60000 });
          await page.click('#placement-options button');
          await page.waitForFunction(() => document.querySelector('#placement-feedback').textContent.includes('Cevap doğrulanamadı'));
          assert.equal(await page.$eval('#placement-next', el => el.hidden), true);
          assert.equal(await page.evaluate(() => localStorage.getItem('languago:placement-draft')), null);
          assert.equal(await page.$$eval('#placement-options button:disabled', els => els.length), 0);
          await page.focus('#placement-options button');
          await page.keyboard.press('Enter');
          await page.waitForSelector('#placement-next', { visible: true, timeout: 60000 });
        }
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('languago:placement-draft')).answers.length), 1);
        assert.equal(checks, 2);
        assert.equal(saves, 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
        results.push({ width, mode, status: 'pass', checks, consoleErrors: errors.length });
      } finally { await context.close(); }
    }
  }
  console.log(JSON.stringify({ base, results, realSaveRequests: 0 }, null, 2));
} finally { await browser.close(); }
