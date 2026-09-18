import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const base = process.env.AUTH_SMOKE_BASE || 'http://127.0.0.1:4321';
const key = 'languago:placement-draft';
const draft = JSON.stringify({ answers: [{ id: 'placement-00001', selectedIndex: 0 }] });
const newer = JSON.stringify({ answers: [{ id: 'placement-00002', selectedIndex: 1 }] });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const results = [];
try {
  for (const width of [1440, 390]) {
    for (const route of ['signin', 'signup']) {
      for (const mode of ['blocked-storage', 'stalled-save', 'saved', 'newer-draft', 'corrupt-draft', ...(route === 'signup' ? ['email-confirmation'] : [])]) {
        const context = await browser.createBrowserContext();
        const page = await context.newPage();
        await page.setViewport({ width, height: 950 });
        await page.setBypassServiceWorker(true);
        await page.setCacheEnabled(false);
        const errors = [];
        const saves = [];
        const authRequests = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
        await page.setRequestInterception(true);
        page.on('request', async (request) => {
          const pathname = new URL(request.url()).pathname;
          // Test doubles at mutation boundaries: never create an account or write learner data.
          if (pathname === `/api/auth/${route}`) {
            authRequests.push(JSON.parse(request.postData()));
            return void request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, hasSession: mode !== 'email-confirmation' }) });
          }
          if (pathname === '/api/placement/save') {
            saves.push(JSON.parse(request.postData()));
            if (mode === 'stalled-save') return; // Browser AbortController must end this fetch.
            if (mode === 'newer-draft') await page.evaluate((key, raw) => localStorage.setItem(key, raw), key, newer);
            return void request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
          }
          if (pathname === '/dashboard' && request.isNavigationRequest()) {
            return void request.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Navigation test double</title><p id="navigation-reached">Dashboard navigation reached</p>' });
          }
          if (request.method() !== 'GET') return void request.abort();
          return void request.continue();
        });
        assert.equal((await page.goto(`${base}/${route}?from=placement`, { waitUntil: 'networkidle2', timeout: 60_000 })).status(), 200);
        await page.evaluate(({ key, raw, blocked }) => {
          localStorage.setItem(key, raw);
          if (blocked) {
            const original = Storage.prototype.getItem;
            Storage.prototype.getItem = function (name) {
              if (name === key) throw new DOMException('Test storage policy', 'SecurityError');
              return original.call(this, name);
            };
          }
        }, { key, raw: mode === 'corrupt-draft' ? '{broken' : draft, blocked: mode === 'blocked-storage' });
        await page.type('#email', 'auth-smoke@example.invalid');
        await page.type('#password', 'test-only-not-a-real-password');
        await page.focus(`#${route}-submit`);
        assert.equal(await page.evaluate(() => document.activeElement.matches('button[type="submit"]')), true);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        const started = Date.now();
        await page.keyboard.press('Enter');
        if (mode === 'email-confirmation') {
          await page.waitForFunction(() => document.querySelector('#signup-feedback').textContent.includes('Hesabın oluşturuldu'), { timeout: 8000 });
        } else {
          await page.waitForSelector('#navigation-reached', { timeout: 8000 });
        }
        const elapsedMs = Date.now() - started;
        assert.equal(authRequests.length, 1);
        const expectedSaves = ['blocked-storage', 'corrupt-draft', 'email-confirmation'].includes(mode) ? 0 : 1;
        assert.equal(saves.length, expectedSaves);
        if (expectedSaves) assert.deepEqual(saves[0], JSON.parse(draft));
        if (mode !== 'blocked-storage') {
          const stored = await page.evaluate((key) => localStorage.getItem(key), key);
          const expected = mode === 'saved' ? null : mode === 'newer-draft' ? newer : mode === 'corrupt-draft' ? '{broken' : draft;
          assert.equal(stored, expected);
        }
        if (mode === 'stalled-save') assert.ok(elapsedMs >= 2900 && elapsedMs < 8000, `bounded transfer took ${elapsedMs}ms`);
        assert.deepEqual(errors, []);
        results.push({ width, route, mode, status: 'pass', elapsedMs, interceptedSaves: saves.length, consoleErrors: errors.length });
        await context.close();
      }
    }
  }
  console.log(JSON.stringify({ base, scenarios: results.length, results, realAuthOrSaveRequests: 0, dashboard: 'navigation test double, not an authenticated session' }, null, 2));
} finally { await browser.close(); }
