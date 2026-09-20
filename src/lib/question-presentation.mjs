function hashSeed(value) {
  let hash = 2166136261;
  const text = String(value || '');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Present a multiple-choice item in a stable but non-source order.
 * The answer index and per-option explanations move with their options.
 */
export function presentMultipleChoice(question, seed = '') {
  const options = Array.isArray(question?.options) ? question.options : [];
  const answer = Number.isInteger(question?.a) ? question.a : -1;
  if (options.length < 2 || answer < 0 || answer >= options.length) return question;
  const shift = hashSeed(seed) % options.length;
  const order = options.map((_, index) => (index + shift) % options.length);
  const presented = {
    ...question,
    options: order.map((index) => options[index]),
    a: order.indexOf(answer),
  };
  if (Array.isArray(question.why)) presented.why = order.map((index) => question.why[index] ?? '');
  return presented;
}
