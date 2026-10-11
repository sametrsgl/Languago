// Makes the site's audio once with Google Cloud Text-to-Speech.
//
//   node scripts/tts.mjs <env file> [level-test] [kids] [vocab]
//
// The env file (OUTSIDE this public repo) holds GOOGLE_TTS_KEY=...; the key is
// only sent to Google and never printed. Files that already exist are skipped,
// so re-running only fills gaps (delete a file to remake it).
//   level-test: public/audio/level-test/<clip id>.mp3   (18 adult listening clips)
//   kids:       public/audio/kids/<id>.mp3              (kids' listening clips and words)
//   vocab:      public/audio/vocab/<level>/<word id>.mp3 (every vocabulary card)
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';

const [envPath, ...targetsArg] = process.argv.slice(2);
const targets = targetsArg.length ? targetsArg : ['level-test', 'kids', 'vocab'];
if (!envPath || !existsSync(envPath)) { console.error('Usage: node scripts/tts.mjs <env file> [level-test] [kids] [vocab]'); process.exit(1); }
const key = (readFileSync(envPath, 'utf8').match(/^\s*GOOGLE_TTS_KEY\s*=\s*(\S+)/m) || [])[1];
if (!key) { console.error('GOOGLE_TTS_KEY not found in the env file.'); process.exit(1); }

const VOICES = {
  'gb-f': ['en-GB-Neural2-C', 'en-GB-Neural2-A'], 'gb-m': ['en-GB-Neural2-B', 'en-GB-Neural2-D'],
  'us-f': ['en-US-Neural2-F', 'en-US-Neural2-C'], 'us-m': ['en-US-Neural2-J', 'en-US-Neural2-D'],
  'au-f': ['en-AU-Neural2-C', 'en-AU-Neural2-A'], 'au-m': ['en-AU-Neural2-B', 'en-AU-Neural2-D'],
};
const RATE = { A1: 0.85, A2: 0.92, B1: 0.97, B2: 1.0, C1: 1.0, C2: 1.03, P: 0.8, 1: 0.85, 2: 0.92 };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let chars = 0, made = 0, skipped = 0;

async function speak(text, voice, rate, pauseMs = 450) {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { ssml: `<speak>${esc(text)}<break time="${pauseMs}ms"/></speak>` },
      voice: { languageCode: voice.slice(0, 5), name: voice },
      audioConfig: { audioEncoding: 'MP3', speakingRate: rate, sampleRateHertz: 24000 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google TTS ${res.status}: ${data?.error?.message || 'error'}`);
  chars += text.length;
  return Buffer.from(data.audioContent, 'base64');
}
const outDir = (rel) => { const u = new URL(`../public/audio/${rel}/`, import.meta.url); mkdirSync(u, { recursive: true }); return u; };
async function clip(dir, id, lines, speakers, rate) {
  const file = new URL(`${id}.mp3`, dir);
  if (existsSync(file)) { skipped++; return; }
  const pick = Number.parseInt(String(id).replace(/[^a-z0-9]/gi, '').slice(-4), 36) % 2;
  const parts = [];
  for (const [sp, text] of lines) parts.push(await speak(text, VOICES[speakers[sp]][pick], rate));
  writeFileSync(file, Buffer.concat(parts));
  made++;
}

if (targets.includes('level-test')) {
  const { bank } = await import('../src/lib/level-test-bank.ts');
  const dir = outDir('level-test');
  for (const u of bank().units.filter((x) => x.skill === 'listening')) await clip(dir, u.id, u.lines, u.speakers, RATE[u.level] || 1);
  console.log('level-test done');
}
if (targets.includes('kids')) {
  const { kidsBank } = await import('../src/lib/kids-test.ts');
  const dir = outDir('kids');
  const b = kidsBank();
  for (const u of b.units.filter((x) => x.skill === 'listening')) await clip(dir, u.id, u.lines, u.speakers, 0.85);
  for (const i of b.items.filter((x) => x.type === 'hear')) await clip(dir, i.id, [['A', i.say]], { A: 'gb-f' }, 0.8);
  console.log('kids done');
}
if (targets.includes('vocab')) {
  const vdir = new URL('../src/data/vocab/', import.meta.url);
  for (const f of readdirSync(vdir).filter((x) => /^[a-c][12]\.json$/.test(x))) {
    const level = f.slice(0, 2);
    const dir = outDir(`vocab/${level}`);
    const words = JSON.parse(readFileSync(new URL(f, vdir), 'utf8'));
    for (const w of words) {
      const file = new URL(`${w.id}.mp3`, dir);
      if (existsSync(file)) { skipped++; continue; }
      writeFileSync(file, await speak(w.word, 'en-GB-Neural2-C', 0.9, 150));
      made++;
    }
    console.log(`vocab ${level} done (${words.length})`);
  }
}
console.log(`made ${made}, already there ${skipped}, ${chars} characters sent.`);
