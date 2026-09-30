import type { APIRoute } from 'astro';
import { buildCuratedClassTopics } from '../../../lib/game-classroom.mjs';
import { grammarTopicToPack, blankProblem } from '../../../classroom/core/pack.mjs';
import { unsafeWords } from '../../../classroom/core/generate.mjs';
import PICTURES from '../../../data/pictures.json';

// Built-in grammar packs per level, generated at build time as static JSON so
// the games can cache them and keep working on weak school networks.
export const prerender = true;

const LEVELS = ['a1', 'a2', 'b1', 'b2'] as const;

// The curated units were written for adults. Items that touch a topic the
// young groups skip (rent, boss, office, smoking...) are marked so the game
// leaves them out for Genç classes; everything the class reads is checked.
function youngOk(it: any): boolean {
  const text = [it.stem, ...(it.options || []), it.whyTr || '', ...(it.whyOpt || [])].join(' ');
  return unsafeWords(text).length === 0 && !/\bsmok/i.test(text);
}

export function getStaticPaths() {
  return LEVELS.map((level) => ({ params: { level } }));
}

export const GET: APIRoute = async ({ params }) => {
  const level = String(params.level);
  if (!LEVELS.includes(level as (typeof LEVELS)[number])) return new Response('Not found', { status: 404 });
  const upper = level.toUpperCase();
  const gramMod = await import(`../../../data/grammar_${level}.js`);
  const mcqMod = await import(`../../../data/grammar_mcq_${level}.js`);
  const topics = buildCuratedClassTopics({
    level,
    levelLabel: upper,
    grammar: gramMod[`GRAMMAR_${upper}`],
    mcqGroups: mcqMod[`GRAMMAR_MCQ_${upper}`],
  });
  // Picture vocabulary topics (Fluent Emoji, see scripts/build-pictures.mjs):
  // concrete, picturable words that work for every group, kids first.
  const pictureTopics = PICTURES.topics.map((t: any) => ({
    id: `pic-${t.id}`,
    title: `${t.tr} · ${t.en}`,
    short: `${t.words.length} resimli kelime`,
    kind: 'picture',
    items: t.words.map((w: any) => ({
      id: `pic:${t.id}:${w.word}`,
      type: 'vocab',
      term: w.word,
      pic: `/pictures/${w.pic}.svg`,
      tr: w.tr,
      q: w.q,
      find: w.find,
      say: w.say,
      topic: t.id,
      // Confusable group and colour/shape kind: presentVocab keeps a word's
      // wrong options out of its group and inside its kind.
      ...(w.cg ? { cg: w.cg } : {}),
      ...(w.cat ? { cat: w.cat } : {}),
      level: upper,
    })),
  }));
  const body = {
    schema: 'lg.catalog/1',
    level,
    topics: [
      ...pictureTopics,
      ...topics.map((t: any) => {
        const pack = grammarTopicToPack(t, upper);
        // Items the stage cannot show well (doubled word when filled, unsplittable
        // multi-blank keys) are left out of the games; the source bank is unchanged.
        const items = pack.items.filter((it: any) => !blankProblem(it.stem, it.options[it.answer]));
        return { id: t.id, title: t.title, short: t.short, kind: 'grammar', items: items.map((it: any) => ({ ...it, youngOk: youngOk(it) })) };
      }),
    ],
  };
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
};
