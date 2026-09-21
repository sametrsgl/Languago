import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const base = process.env.CLASSROOM_SMOKE_BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewport({ width, height: 950 });
    await page.setBypassServiceWorker(true);
    assert.equal((await page.goto(`${base}/sinif-oyunu`, { waitUntil: 'networkidle2' })).status(), 200);
    // Deterministic power tiles: floor(0.3 * 4) selects the double-points card.
    await page.evaluate(() => { Math.random = () => 0.3; });
    await page.click('#topicGrid .cm-topic');
    await page.click('#teamRow [data-t="2"]');
    await page.type('#teamNameInputs input', 'Blue Team');
    await page.click('#startBtn');
    await page.click('#tileGrid .power');
    assert.match(await page.$eval('.cm-power-title', el => el.textContent), /İki Katı Puan/);
    await page.click('[data-power-ok]');
    // Abandon the round while a bonus is pending, then start a fresh round.
    await page.click('#quitBtn');
    await page.click('#startBtn');
    await page.click('#tileGrid .cm-tile:not(.power)');
    assert.doesNotMatch(await page.$eval('.cm-q-point', el => el.textContent), /2×/, 'new game must not inherit a previous bonus');
    const points = await page.$eval('.cm-q-point', el => Number(el.textContent.match(/\+(\d+)/)[1]));
    await page.click('#revealBtn');
    await page.click('[data-act="ok"]');
    assert.equal(await page.$eval('[data-sv="0"]', el => Number(el.textContent)), points);
    await page.click('#resetBtn');
    assert.equal(await page.$eval('.cm-score .sn', el => el.textContent), 'Blue Team', 'reset must retain team configuration');
    assert.equal(await page.$eval('[data-sv="0"]', el => Number(el.textContent)), 0);
    assert.equal(await page.$$eval('#tileGrid .cm-tile:not(.used)', els => els.length), 24);
    await page.click('#quitBtn');
    assert.equal(await page.$eval('#teamNameInputs input', el => el.value), 'Blue Team');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ width, freshBonus: 'pass', scoring: 'pass', retainedTeamName: 'pass', freshTiles: 24, consoleErrors: 0 }));
    await page.close();
  }
} finally { await browser.close(); }
