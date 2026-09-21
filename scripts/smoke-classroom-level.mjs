import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const base = process.env.CLASSROOM_SMOKE_BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage();
    try {
      await page.setViewport({ width, height: 950 });
      await page.setBypassServiceWorker(true);
      await page.setCacheEnabled(false);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      assert.equal((await page.goto(`${base}/sinif-oyunu`, { waitUntil: 'networkidle2', timeout: 60000 })).status(), 200);
      await page.click('#diffRow [data-diff="adult"]');
      await page.click('#topicGrid .cm-topic[data-id^="c1-"]');
      assert.equal(await page.$eval('#startBtn', el => el.disabled), false);
      const selected = await page.$eval('#topicGrid .on', el => el.dataset.id);
      // Re-selecting the same difficulty must preserve a still-valid topic.
      await page.click('#diffRow [data-diff="adult"]');
      assert.equal(await page.$eval('#topicGrid .on', el => el.dataset.id), selected);
      assert.equal(await page.$eval('#startBtn', el => el.disabled), false);
      await page.focus('#diffRow [data-diff="primary"]');
      await page.keyboard.press('Enter');
      assert.equal(await page.$$eval('#topicGrid .on', els => els.length), 0);
      assert.equal(await page.$eval('#startBtn', el => el.disabled), true, 'hidden stale topic must not remain startable');
      assert.match(await page.$eval('#lobbyNote', el => el.textContent), /Konu seçin/);
      // The handler must enforce the invariant even if a disabled button is bypassed.
      await page.$eval('#startBtn', el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      assert.equal(await page.$eval('#scrBoard', el => el.hidden), true);
      await page.click('#topicGrid .cm-topic');
      const title = await page.$eval('#topicGrid .on .tt', el => el.textContent);
      await page.click('#startBtn');
      assert.equal(await page.$eval('#scrBoard', el => el.hidden), false);
      assert.equal(await page.$$eval('#tileGrid .cm-tile', els => els.length), 24);
      await page.click('#tileGrid .cm-tile:not(.power)');
      assert.ok((await page.$eval('.cm-q-topic', el => el.textContent)).startsWith(title));
      const expectedExplanation = await page.evaluate(() => {
        const topics = JSON.parse(document.getElementById('cm-topics').textContent);
        const stem = document.querySelector('.cm-q-text').textContent;
        const topicId = document.querySelector('#topicGrid .on').dataset.id;
        const question = topics.find(t => t.id === topicId).qs.find(q => q.q === stem);
        return Array.isArray(question.why) ? question.why[question.a] : question.why;
      });
      assert.ok(expectedExplanation, 'sample question must have an explanation');
      assert.equal(await page.$eval('#answerBox', el => getComputedStyle(el).display), 'none');
      await page.click('#revealBtn');
      assert.equal(await page.$eval('#answerExplanation', el => el.textContent), expectedExplanation);
      await page.click('[data-act="ok"]');
      assert.equal(await page.$eval('#modal', el => el.hidden), true);
      assert.equal(await page.$eval('[data-sv="0"]', el => Number(el.textContent)) > 0, true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      // Finish the real board, including power tiles, then verify a fresh game.
      while (await page.$('#tileGrid .cm-tile:not(.used)')) {
        await page.click('#tileGrid .cm-tile:not(.used)');
        if (await page.$('#revealBtn')) {
          await page.click('#revealBtn');
          await page.click('[data-act="ok"]');
        } else {
          await page.click('[data-power-ok], [data-power-t]');
        }
      }
      assert.equal(await page.$eval('#scrWin', el => el.hidden), false);
      await page.click('#replayBtn');
      await page.click('#startBtn');
      await page.click('#resetBtn');
      assert.equal(await page.$$eval('#tileGrid .cm-tile:not(.used)', els => els.length), 24);
      assert.equal(await page.$eval('[data-sv="0"]', el => Number(el.textContent)), 0);
      assert.deepEqual(errors, []);
      results.push({ width, staleSelectionBlocked: true, validSelectionPreserved: true, playableTiles: 24, scoring: 'pass', consoleErrors: errors.length });
    } finally { await page.close(); }
  }
  console.log(JSON.stringify({ base, results }, null, 2));
} finally { await browser.close(); }
