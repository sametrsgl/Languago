import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
const base = process.env.CLASSROOM_SMOKE_BASE || 'http://127.0.0.1:4321';
const evidence = process.env.CLASSROOM_EVIDENCE_DIR;
if (evidence) await mkdir(evidence, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  for (const [width, height] of [[1440, 950], [390, 650]]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewport({ width, height });
    await page.setBypassServiceWorker(true);
    assert.equal((await page.goto(`${base}/sinif-oyunu`, { waitUntil: 'networkidle2' })).status(), 200);
    await page.evaluate(() => { Math.random = () => 0.3; });
    await page.click('#topicGrid .cm-topic');
    await page.click('#startBtn');
    await page.focus('#tileGrid .cm-tile:not(.power)');
    await page.keyboard.press('Enter');
    if (evidence) await page.screenshot({ path: `${evidence}/question-${width}.png` });
    const focusInside = () => page.$eval('#modal', el => el.contains(document.activeElement));
    assert.equal(await focusInside(), true, 'opening a tile must move keyboard focus into its dialog');
    assert.equal(await page.$eval('#modal', el => el.matches(':modal')), true, 'background must be inert via native modality');
    await page.keyboard.press('Tab');
    // Native dialogs can briefly focus the browser chrome, but never the background document.
    assert.equal(await page.evaluate(() => document.activeElement === document.body || document.querySelector('#modal').contains(document.activeElement)), true);
    await page.focus('#revealBtn');
    await page.keyboard.press('Enter');
    assert.equal(await page.$eval('[data-act="ok"]', el => el === document.activeElement), true, 'reveal must move focus to grading');
    // Simulate a long explanation without mutating persisted learner/content data.
    await page.$eval('#answerExplanation', el => { el.textContent = 'Uzun açıklama. '.repeat(150); });
    assert.equal(await page.$eval('#modalCard', el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && el.scrollHeight > el.clientHeight; }), true, 'long feedback must scroll within the viewport');
    await page.$eval('[data-act="skip"]', el => el.scrollIntoView({ block: 'center' }));
    if (evidence) await page.screenshot({ path: `${evidence}/feedback-${width}.png` });
    await page.click('[data-act="skip"]');
    assert.equal(await page.$eval('#tileGrid .cm-tile:not(.used)', el => el === document.activeElement), true, 'consumed tile is replaced: focus next playable tile');
    await page.click('#tileGrid .power:not(.used)');
    assert.equal(await focusInside(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('#modal', el => el.hidden && !el.open), true);
    while (await page.$('#tileGrid .cm-tile:not(.used)')) {
      await page.keyboard.press('Enter');
      await page.keyboard.press('Escape');
    }
    assert.equal(await page.$eval('#replayBtn', el => el === document.activeElement), true, 'completion must focus replay');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ width, height, modalFocus: 'pass', backgroundInert: 'pass', revealFocus: 'pass', scrollableFeedback: 'pass', keyboardCompletion: 'pass', consoleErrors: 0 }));
    await page.close();
  }
} finally { await browser.close(); }
