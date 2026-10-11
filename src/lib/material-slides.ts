// Slides and worksheet data for one learning-path day (teacher materials).
import type { Day, Topic } from './path-content';
import { shuffleOrder } from './path.mjs';
// Same option order as the learner sees in the app (path.mjs presentQuestions).
const shown = (o: string[], key: string) => shuffleOrder(key, o.length).map((k: number) => o[k]);

export function buildMaterials(d: Day, topic: Topic | null, level: string, dayNo: number, label = `Gün ${dayNo}`) {
  const L = 'ABCD';
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const bold = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const gap = (s: string) => bold(s).replace(/_{3,}/g, '<span class="gap"></span>');
  type S = { kind: string; html: string; answer?: string };
  const slides: S[] = [];
  slides.push({ kind: 'title', html: `<p class="eyebrow">${level} · ${label} · ${d.theme}</p><h1>${topic ? bold(topic.title) : ''}</h1><p class="sub">${topic ? topic.tr : ''}</p>` });
  if (topic) {
    slides.push({ kind: 'explain', html: `<h2>${bold(topic.tr)}</h2><ul>${topic.explain.map((p) => `<li>${bold(p)}</li>`).join('')}</ul>` });
    slides.push({ kind: 'examples', html: `<h2>Örnekler</h2><table>${topic.examples.map(([en, tr]) => `<tr><td>${bold(en)}</td><td class="tr">${tr}</td></tr>`).join('')}</table><p class="note">${bold(topic.mistake)}</p>` });
  }
  d.grammar.questions.forEach((q, i) => slides.push({ kind: 'q', html: `<p class="eyebrow">Dilbilgisi · ${i + 1} / ${d.grammar.questions.length}</p><h2>${gap(q.q)}</h2><ol class="opts">${shown(q.o, `${level}-${dayNo}-grammar#${i}`).map((o) => `<li>${bold(o)}</li>`).join('')}</ol>`, answer: q.o[0] }));
  slides.push({ kind: 'text', html: `<p class="eyebrow">Okuma</p><h2>${bold(d.reading.title)}</h2><p class="read">${bold(d.reading.text)}</p>` });
  d.reading.questions.forEach((q, i) => slides.push({ kind: 'q', html: `<p class="eyebrow">Okuma · ${i + 1} / ${d.reading.questions.length}</p><h2>${bold(q.q)}</h2><ol class="opts">${shown(q.o, `${level}-${dayNo}-reading#${i}`).map((o) => `<li>${bold(o)}</li>`).join('')}</ol>`, answer: q.o[0] }));
  slides.push({ kind: 'text', html: `<p class="eyebrow">Yazma</p><h2>${bold(d.writing.prompt_en)}</h2><p class="sub">${bold(d.writing.prompt)}</p><p class="sub">${d.writing.min}–${d.writing.max} kelime · ${d.writing.focus}</p>` });
  slides.push({ kind: 'text', html: `<p class="eyebrow">Konuşma</p><h2>Sesli okuyun</h2><ul>${d.speaking.read.map((s) => `<li>${bold(s)}</li>`).join('')}</ul><h2 style="margin-top:28px">${bold(d.speaking.ask.q)}</h2>` });
  // Stable shuffle for the worksheet so the right answer is not always (a).
  const shuffle = (o: string[], seed: number) => { const a = o.map((x, i) => ({ x, k: (Math.sin(seed * 97 + i * 13) + 1) * 1000 })); a.sort((p, q) => p.k - q.k); return a.map((y) => y.x); };
  const ws = (qs: { q: string; o: string[] }[], base: number) => qs.map((q, i) => { const o = shuffle(q.o, base + i); return { q: q.q, o, key: L[o.indexOf(q.o[0])] }; });
  const wsGrammar = ws(d.grammar.questions, dayNo * 100);
  const wsReading = ws(d.reading.questions, dayNo * 100 + 50);
  return { L, bold, gap, slides, wsGrammar, wsReading };
}
