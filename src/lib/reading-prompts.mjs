const GENERIC_READING_PROMPTS = new Map([
  ['what is the main idea of the passage?', (title) => `Which summary best captures the writer's message in “${title}”?`],
  ['what is the passage mainly about?', (title) => `Which statement best summarizes the discussion in “${title}”?`],
  ['what is the passage about?', (title) => `What overall issue does “${title}” examine?`],
  ['what is the main point of the passage?', (title) => `Which conclusion does the passage emphasize in “${title}”?`],
  ['what is the main idea?', (title) => `Which summary best captures the message of “${title}”?`],
]);

const CONTEXTUAL_READING_PATTERNS = [
  [/^what is the central idea of the passage\??$/i, (title) => `Which central idea best fits “${title}”?`],
  [/^according to the passage, which statement is (true|false)\??$/i, (title, match) => `In “${title}”, which statement is ${match[1].toUpperCase()}?`],
  [/^what is the main (purpose|topic|argument) of the passage\??$/i, (title, match) => `What is the main ${match[1]} of “${title}”?`],
  [/^the word .+ is closest in meaning to\??$/i, (title, match) => `In “${title}”, ${match[0].charAt(0).toLocaleLowerCase('en-US') + match[0].slice(1)}`],
];

function normalizePrompt(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ');
}

/**
 * Add a passage-specific purpose to generic comprehension stems.
 * The options and answer key are deliberately unchanged.
 */
export function displayReadingPrompt(question, passageTitle) {
  const original = String(question?.q ?? question?.prompt ?? '').trim();
  const title = String(passageTitle || '').trim();
  if (!original || !title) return original;
  const factory = GENERIC_READING_PROMPTS.get(normalizePrompt(original));
  if (factory) return factory(title);
  for (const [pattern, contextualize] of CONTEXTUAL_READING_PATTERNS) {
    const match = original.match(pattern);
    if (match) return contextualize(title, match);
  }
  return original;
}

export function isGenericReadingPrompt(prompt) {
  return GENERIC_READING_PROMPTS.has(normalizePrompt(prompt));
}
