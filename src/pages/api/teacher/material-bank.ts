// Languago — teacher material generator: serve the grammar unit bank as JSON
// (used by /teacher/materyal to build printable materials). Server-side, so the
// heavy data is not inlined into any page; the client fetches it once.
export const prerender = false;
import { loadGrammar, loadGrammarMcq } from '../../../lib/study';

const levels = [
  { key: 'a1', bank: 'a1', label: 'A1 · Başlangıç' },
  { key: 'a2', bank: 'a2', label: 'A2 · Temel' },
  { key: 'b1', bank: 'b1', label: 'B1 · Orta' },
  { key: 'b2', bank: 'b2', label: 'B2 · Orta-Üstü' },
  { key: 'c1', bank: 'c1', label: 'C1 · İleri' },
];

export async function GET() {
  const units: any[] = [];
  for (const lv of levels) {
    const gmod: any = await loadGrammar(lv.bank);
    const GRAM: any = gmod?.[`GRAMMAR_${lv.bank.toUpperCase()}`] || null;
    const mcqmod: any = await loadGrammarMcq(lv.bank);
    const MCQM: any = mcqmod?.[`GRAMMAR_MCQ_${lv.bank.toUpperCase()}`] || null;
    if (!GRAM?.units) continue;
    for (const u of GRAM.units) {
      units.push({
        id: u.id,
        title: u.title || u.short,
        short: u.short || u.title,
        level: lv.bank,
        mcq: (MCQM?.[u.id] || []).map((q: any) => ({
          q: q.q, options: q.options, a: q.a, why: q.why || undefined,
        })),
        practice: (u.practice || []).map((p: any) => ({ q: p.q, a: p.a || [], hint: p.hint })),
      });
    }
  }
  return new Response(JSON.stringify(units), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}