import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const base = process.env.CLASSROOM_SMOKE_BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewport({ width, height: 950 });
    await page.setBypassServiceWorker(true);
    assert.equal((await page.goto(`${base}/sinif-oyunu`, { waitUntil: 'networkidle2' })).status(), 200);
    await page.evaluate(() => { Math.random = () => 0.3; });
    await page.click('#topicGrid .cm-topic');
    await page.click('#teamRow [data-t="2"]');
    await page.click('#startBtn');
    // A pending double bonus must be consumed by a skipped question, not inherited.
    await page.click('#tileGrid .power');
    await page.click('[data-power-ok]');
    await page.click('#tileGrid .cm-tile:not(.power):not(.used)');
    assert.match(await page.$eval('.cm-q-point', el => el.textContent), /2×/);
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('#modal', el => el.hidden), true);
    assert.equal(await page.$eval('.cm-score.active .sn', el => el.textContent), 'Takım 1', 'dismissal must advance the turn');
    await page.keyboard.press('Escape'); // hidden modal must not advance again
    assert.equal(await page.$eval('.cm-score.active .sn', el => el.textContent), 'Takım 1');
    await page.click('#tileGrid .cm-tile:not(.power):not(.used)');
    assert.doesNotMatch(await page.$eval('.cm-q-point', el => el.textContent), /2×/);
    await page.click('#revealBtn');
    await page.keyboard.press('Escape');
    // Dismissing power cards must not apply their effect or strand the final tile.
    while (await page.$('#tileGrid .cm-tile:not(.used)')) {
      await page.click('#tileGrid .cm-tile:not(.used)');
      await page.keyboard.press('Escape');
    }
    assert.equal(await page.$eval('#scrWin', el => el.hidden), false, 'last dismissal must complete the game');
    assert.deepEqual(await page.$$eval('.cm-win-chip', els => els.map(el => el.textContent.split(': ').at(-1))), ['0', '0']);
    await page.click('#replayBtn');
    await page.click('#startBtn');
    assert.equal(await page.$$eval('#tileGrid .cm-tile:not(.used)', els => els.length), 24);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ width, escapeTurn: 'pass', bonusConsumed: 'pass', completion: 'pass', replay: 'pass', consoleErrors: 0 }));
    await page.close();
  }
} finally { await browser.close(); }
