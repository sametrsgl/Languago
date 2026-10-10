// Makes the level test's listening audio once, with Google Cloud Text-to-Speech.
//
//   node scripts/tts-level-test.mjs <path-to-env-file>
//
// The env file (kept OUTSIDE this public repo) holds one line:
//   GOOGLE_TTS_KEY=...   (an API key restricted to the Text-to-Speech API)
// The key is read from that file and sent only to Google; it is never printed.
// Writes public/audio/level-test/<clip id>.mp3 and skips clips that exist,
// so re-running only fills gaps (delete a file to remake it).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { bank } from '../src/lib/level-test-bank.ts';

const envPath = process.argv[2];
if (!envPath || !existsSync(envPath)) {
  console.error('Usage: node scripts/tts-level-test.mjs <env file with GOOGLE_TTS_KEY>');
  process.exit(1);
}
const key = (readFileSync(envPath, 'utf8').match(/^\s*GOOGLE_TTS_KEY\s*=\s*(\S+)/m) || [])[1];
if (!key) { console.error('GOOGLE_TTS_KEY not found in the env file.'); process.exit(1); }

// Accent-gender codes -> Google Neural2 voices (two per code, varied per clip).
const VOICES = {
  'gb-f': ['en-GB-Neural2-C', 'en-GB-Neural2-A'],
  'gb-m': ['en-GB-Neural2-B', 'en-GB-Neural2-D'],
  'us-f': ['en-US-Neural2-F', 'en-US-Neural2-C'],
  'us-m': ['en-US-Neural2-J', 'en-US-Neural2-D'],
  'au-f': ['en-AU-Neural2-C', 'en-AU-Neural2-A'],
  'au-m': ['en-AU-Neural2-B', 'en-AU-Neural2-D'],
};
const RATE = { A1: 0.85, A2: 0.92, B1: 0.97, B2: 1.0, C1: 1.0, C2: 1.03 };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function speak(text, voice, rate) {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { ssml: `<speak>${esc(text)}<break time="450ms"/></speak>` },
      voice: { languageCode: voice.slice(0, 5), name: voice },
      audioConfig: { audioEncoding: 'MP3', speakingRate: rate, sampleRateHertz: 24000 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google TTS ${res.status}: ${data?.error?.message || 'error'}`);
  return Buffer.from(data.audioContent, 'base64');
}

const out = new URL('../public/audio/level-test/', import.meta.url);
mkdirSync(out, { recursive: true });
let made = 0, skipped = 0, chars = 0;
for (const u of bank().units.filter((x) => x.skill === 'listening')) {
  const file = new URL(`${u.id}.mp3`, out);
  if (existsSync(file)) { skipped++; continue; }
  const pick = Number.parseInt(u.id.slice(2), 36) % 2;
  const voiceOf = (sp) => VOICES[u.speakers[sp]][pick];
  const parts = [];
  for (const [sp, text] of u.lines) {
    parts.push(await speak(text, voiceOf(sp), RATE[u.level] || 1));
    chars += text.length;
  }
  writeFileSync(file, Buffer.concat(parts));
  made++;
  console.log(`made ${u.id}.mp3  (${u.level}, ${u.title})`);
}
console.log(`done: ${made} made, ${skipped} already there, ${chars} characters sent.`);
