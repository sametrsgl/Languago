// Small AI helper for learner feedback (writing, speaking). Uses the same
// OpenAI-compatible provider as the classroom packs (LLM_* in Vercel).
// Returns null when AI is not configured or fails; callers fall back.

type Msg = { role: 'system' | 'user'; content: string };

export function aiReady(): boolean {
  return Boolean(import.meta.env.LLM_API_KEY);
}

export async function aiJson<T = any>(messages: Msg[], { maxTokens = 900, timeoutMs = 25_000 } = {}): Promise<T | null> {
  const key = import.meta.env.LLM_API_KEY;
  if (!key) return null;
  const base = (import.meta.env.LLM_BASE_URL || 'https://opencode.ai/zen/go/v1').replace(/\/+$/, '');
  const model = import.meta.env.LLM_MODEL_FAST || import.meta.env.LLM_MODEL || 'deepseek-v4.1-flash';
  const call = async (jsonMode: boolean) => {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: maxTokens, ...(jsonMode ? { response_format: { type: 'json_object' } } : {}) }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 200)}`);
    return JSON.parse(text);
  };
  try {
    let data;
    try { data = await call(true); } catch (e) {
      if (e instanceof Error && /response_format|json_object/i.test(e.message)) data = await call(false); else throw e;
    }
    const content: string = data?.choices?.[0]?.message?.content || '';
    const m = content.match(/\{[\s\S]*\}/);
    return m ? (JSON.parse(m[0]) as T) : null;
  } catch (e) {
    console.warn('[ai] failed:', e instanceof Error ? e.message : String(e));
    return null;
  }
}

const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

export type WritingFeedback = {
  score: number; task: number; grammar: number; vocabulary: number;
  feedback: string; corrections: { wrong: string; right: string; why: string }[]; improved: string;
};

/** Score a learner's text 0–100 for their level and the task, with Turkish feedback. */
export async function scoreWriting(input: { level: string; prompt: string; focus: string; min: number; text: string }): Promise<WritingFeedback | null> {
  const r = await aiJson<any>([
    {
      role: 'system',
      content:
        'You are a kind, precise English teacher for Turkish adult learners. You mark short writing tasks for a CEFR level. ' +
        'Judge the text against what a learner AT THAT LEVEL can do, not against native speakers. ' +
        'Scores (0-100): task (did they answer the prompt fully), grammar (accuracy of the level\'s structures, especially the focus), vocabulary (range and spelling for the level). ' +
        'Overall score = round(0.4*task + 0.4*grammar + 0.2*vocabulary). A text that does the task with only small slips scores 85-95; ' +
        'off-topic, much too short, mostly Turkish or copied from the prompt scores below 60. ' +
        'Reply ONLY with JSON: {"task":n,"grammar":n,"vocabulary":n,"score":n,"feedback":"2-3 short sentences in Turkish, encouraging and specific",' +
        '"corrections":[{"wrong":"exact words from the text","right":"corrected words","why":"short Turkish reason"}] (max 6, only real mistakes),' +
        '"improved":"the learner\'s text with mistakes corrected, keeping their ideas and level"}',
    },
    { role: 'user', content: `Level: ${input.level}\nTask (Turkish): ${input.prompt}\nGrammar focus: ${input.focus}\nMinimum words: ${input.min}\n\nLearner text:\n"""${input.text.slice(0, 2500)}"""` },
  ], { maxTokens: 1100 });
  if (!r) return null;
  const task = clamp(r.task), grammar = clamp(r.grammar), vocabulary = clamp(r.vocabulary);
  return {
    task, grammar, vocabulary,
    score: clamp(r.score ?? 0.4 * task + 0.4 * grammar + 0.2 * vocabulary),
    feedback: String(r.feedback || '').slice(0, 600),
    corrections: (Array.isArray(r.corrections) ? r.corrections : []).slice(0, 6).map((c: any) => ({ wrong: String(c.wrong || '').slice(0, 120), right: String(c.right || '').slice(0, 120), why: String(c.why || '').slice(0, 200) })),
    improved: String(r.improved || '').slice(0, 2500),
  };
}

/** Score a spoken answer (speech-to-text transcript) for relevance and accuracy. */
export async function scoreSpokenAnswer(input: { level: string; question: string; transcript: string; minWords: number }) {
  const r = await aiJson<any>([
    {
      role: 'system',
      content:
        'You assess a Turkish adult learner\'s SPOKEN answer, given as an automatic speech-to-text transcript (so ignore punctuation, capital letters and small recognition slips). ' +
        'Judge for the CEFR level: does it answer the question (relevance), is the grammar of the level mostly right, is it long enough. ' +
        'A relevant answer of the right length with small slips scores 85-95. Off-topic, one or two words, or Turkish scores below 60. ' +
        'Reply ONLY with JSON: {"score":n,"feedback":"2 short sentences in Turkish","better":"a natural model answer at the level using the learner\'s ideas"}',
    },
    { role: 'user', content: `Level: ${input.level}\nQuestion: ${input.question}\nExpected length: at least ${input.minWords} words\nTranscript: "${input.transcript.slice(0, 1200)}"` },
  ], { maxTokens: 500 });
  if (!r) return null;
  return { score: clamp(r.score), feedback: String(r.feedback || '').slice(0, 400), better: String(r.better || '').slice(0, 600) };
}
