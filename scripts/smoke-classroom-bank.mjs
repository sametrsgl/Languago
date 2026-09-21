import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { buildCuratedClassTopics } from '../src/lib/game-classroom.mjs';

const base = process.env.CLASSROOM_SMOKE_BASE || 'http://127.0.0.1:4321';
const expected = [];
for (const level of ['a1', 'a2', 'b1', 'b2', 'c1']) {
  const grammar = await import(`../src/data/grammar_${level}.js`);
  const mcq = await import(`../src/data/grammar_mcq_${level}.js`);
  expected.push(...buildCuratedClassTopics({ level, levelLabel: level.toUpperCase(),
    grammar: grammar[`GRAMMAR_${level.toUpperCase()}`], mcqGroups: mcq[`GRAMMAR_MCQ_${level.toUpperCase()}`] }));
}
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  for (const [width, height] of [[1440, 950], [390, 650]]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewport({ width, height });
    await page.setBypassServiceWorker(true);
    assert.equal((await page.goto(`${base}/sinif-oyunu`, { waitUntil: 'networkidle2' })).status(), 200);
    const topics = await page.$eval('#cm-topics', el => JSON.parse(el.textContent));
    assert.equal(topics.length, 97, 'preserve every existing topic');
    assert.deepEqual(topics.map(t => t.id), expected.map(t => t.id));
    for (const topic of topics) {
      const curated = expected.find(t => t.id === topic.id);
      assert.equal(topic.qs.length, curated.qs.length, `${topic.id}: curated-only question count`);
      topic.qs.forEach((q, i) => assert.deepEqual(q, curated.qs[i], `${q.id}: served answer/explanation mapping`));
      assert.ok(topic.qs.length >= 20, topic.id);
      assert.equal(new Set(topic.qs.map(q => q.q.trim().toLowerCase().replace(/\s+/g, ' '))).size, topic.qs.length);
      for (const q of topic.qs) {
        assert.ok(q.o.length >= 4, q.id);
        assert.ok(q.a >= 0 && q.a < q.o.length, q.id);
        assert.equal(q.t, 3, 'no synthetic practice distractors');
      }
    }
    await page.click('#topicGrid .cm-topic');
    await page.click('#startBtn');
    assert.equal(await page.$$eval('#tileGrid .cm-tile', tiles => tiles.length), 24);
    const seen = new Set();
    while (await page.$('#tileGrid .cm-tile:not(.used)')) {
      await page.click('#tileGrid .cm-tile:not(.used)');
      if (await page.$('#revealBtn')) {
        const stem = await page.$eval('.cm-q-text', el => el.textContent);
        assert.ok(!seen.has(stem), 'no repeated stem within the board');
        seen.add(stem);
        const source = topics[0].qs.find(q => q.q === stem);
        assert.ok(source);
        assert.equal(await page.$$eval('.cm-q-opt', els => els.length), source.o.length);
        await page.click('#revealBtn');
        assert.equal(await page.$eval('.cm-answer', el => el.textContent), `✅ Cevap: ${source.o[source.a]}`);
        assert.equal(await page.$eval('#answerExplanation', el => el.textContent),
          (Array.isArray(source.why) ? source.why[source.a] : source.why) || 'Bu cevabın neden uygun olduğunu takımınızla açıklayın.');
        if (process.env.CLASSROOM_EVIDENCE_DIR && seen.size === 1) {
          await mkdir(process.env.CLASSROOM_EVIDENCE_DIR, { recursive: true });
          await page.screenshot({ path: `${process.env.CLASSROOM_EVIDENCE_DIR}/curated-${width}.png` });
        }
        await page.click('[data-act="ok"]');
      } else {
        await page.keyboard.press('Escape');
      }
    }
    assert.equal(seen.size, 19);
    assert.equal(await page.$eval('#scrWin', el => el.hidden), false);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ width, topics: topics.length, questions: topics.reduce((n, t) => n + t.qs.length, 0), distinctQuestionsPlayed: seen.size, answerExplanationMapping: 'pass', consoleErrors: errors.length }));
    await page.close();
  }
} finally { await browser.close(); }
