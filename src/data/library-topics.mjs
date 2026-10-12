// Built-in topic headings for the teacher's library (/app/materyaller).
// A section ("track") is a CEFR level or an exam. A1 uses the learning path's
// own 24 topics (see library.ts); the other lists are the usual grammar topics
// per level and the section / question types of each exam. Teachers add their
// own headings on top (teacher_topics table).

export const LEVEL_TRACKS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const EXAM_TRACKS = [
  { id: 'IELTS', label: 'IELTS' },
  { id: 'TOEFL', label: 'TOEFL' },
  { id: 'PTE', label: 'PTE' },
  { id: 'YDS', label: 'YDS' },
  { id: 'YOKDIL', label: 'YÖKDİL' },
  { id: 'YDT', label: 'YDT' },
  { id: 'LGS', label: 'LGS' },
];
export const TRACKS = [...LEVEL_TRACKS, ...EXAM_TRACKS.map((e) => e.id)];
export const trackLabel = (t) => EXAM_TRACKS.find((e) => e.id === t)?.label || t;

export const HEADINGS = {
  A2: [
    'Past simple: regular and irregular verbs', 'Past continuous', 'Present continuous for future plans', 'Be going to',
    'Will for predictions and offers', 'Comparatives and superlatives', 'Countable / uncountable: some, any, much, many',
    'Adverbs of frequency and manner', 'Have to / don’t have to', 'Should for advice', 'Present perfect: ever / never',
    'Object pronouns and possessives', 'Prepositions of time and place', 'Too / enough', 'Like + -ing / would like to',
    'Question words and question forms',
  ],
  B1: [
    'Present perfect vs past simple', 'Present perfect continuous', 'Past perfect', 'Used to / would',
    'Future forms: will, going to, present continuous', 'First and second conditionals', 'Passive voice (present and past)',
    'Relative clauses', 'Modals of obligation and permission', 'Modals of deduction (must, might, can’t)',
    'Reported speech (statements)', 'Gerunds and infinitives', 'Phrasal verbs (common)', 'Linking words: although, however, because of',
    'Quantifiers: a few, a little, few, little', 'So / such',
  ],
  B2: [
    'Third and mixed conditionals', 'Wish / if only', 'Passive voice (all tenses) and have something done',
    'Reported speech (questions and commands)', 'Future continuous and future perfect', 'Modals in the past (should have, might have)',
    'Defining and non-defining relative clauses', 'Participle clauses', 'Narrative tenses', 'Inversion with negative adverbials (intro)',
    'Cleft sentences', 'Articles in depth', 'Collocations and word formation', 'Linking and contrast in essays',
    'Phrasal verbs (advanced)', 'Hedging and softening opinions',
  ],
  C1: [
    'Inversion', 'Advanced conditionals (were to, should, had)', 'Emphatic structures and cleft sentences',
    'Nominalisation in formal writing', 'Advanced passive and reporting verbs', 'Ellipsis and substitution',
    'Modal verbs: nuance and speculation', 'Future in the past', 'Complex noun phrases', 'Discourse markers',
    'Idioms and fixed expressions', 'Register: formal vs informal', 'Academic vocabulary', 'Persuasive language',
  ],
  C2: [
    'Subtle tense contrasts', 'Advanced inversion and fronting', 'Subjunctive and formal structures', 'Collocation and connotation',
    'Idiomatic and figurative language', 'Hedging in academic writing', 'Cohesion across long texts', 'Style and register shifts',
    'Advanced word formation', 'Rhetorical devices', 'Critical reading and inference', 'Precision in argument',
  ],
  IELTS: [
    'Listening: form and note completion', 'Listening: maps and plans', 'Listening: multiple choice and matching',
    'Reading: True / False / Not Given', 'Reading: matching headings', 'Reading: summary and sentence completion',
    'Writing Task 1: graphs and charts', 'Writing Task 1: process and maps', 'Writing Task 1 (General): letters',
    'Writing Task 2: opinion essay', 'Writing Task 2: discussion and problem–solution', 'Speaking Part 1: everyday topics',
    'Speaking Part 2: cue card', 'Speaking Part 3: discussion', 'Vocabulary for band 7+', 'Grammar range and accuracy',
  ],
  TOEFL: [
    'Reading: academic passages', 'Reading: daily-life texts', 'Reading: vocabulary in context', 'Listening: lectures',
    'Listening: conversations', 'Writing: academic discussion', 'Writing: email', 'Writing: build a sentence',
    'Speaking: listen and repeat', 'Speaking: interview questions', 'Note-taking skills', 'Academic vocabulary',
  ],
  PTE: [
    'Speaking: read aloud', 'Speaking: repeat sentence', 'Speaking: describe image', 'Speaking: retell lecture',
    'Speaking: answer short question', 'Writing: summarise written text', 'Writing: essay', 'Reading: fill in the blanks',
    'Reading: reorder paragraphs', 'Reading: multiple choice', 'Listening: summarise spoken text', 'Listening: write from dictation',
    'Listening: highlight incorrect words',
  ],
  YDS: [
    'Kelime bilgisi', 'Dil bilgisi: zamanlar', 'Dil bilgisi: edat ve bağlaçlar', 'Cloze test', 'Cümle tamamlama',
    'Çeviri: İngilizce → Türkçe', 'Çeviri: Türkçe → İngilizce', 'Okuma: paragraf soruları', 'Diyalog tamamlama',
    'Anlamca en yakın cümle', 'Paragraf tamamlama', 'Anlam bütünlüğünü bozan cümle', 'Phrasal verbs',
  ],
  YOKDIL: [
    'Kelime bilgisi (alan terimleri)', 'Dil bilgisi', 'Cloze test', 'Cümle tamamlama', 'Çeviri: İngilizce → Türkçe',
    'Çeviri: Türkçe → İngilizce', 'Okuma: paragraf soruları', 'Paragraf tamamlama', 'Anlam bütünlüğünü bozan cümle',
    'Fen bilimleri metinleri', 'Sağlık bilimleri metinleri', 'Sosyal bilimler metinleri',
  ],
  YDT: [
    'Kelime bilgisi', 'Dil bilgisi', 'Cloze test', 'Cümle tamamlama', 'Çeviri: İngilizce → Türkçe', 'Çeviri: Türkçe → İngilizce',
    'Okuma: paragraf soruları', 'Diyalog tamamlama', 'Durum (situation) soruları', 'Anlamca en yakın cümle', 'Paragraf tamamlama',
    'Anlam bütünlüğünü bozan cümle',
  ],
  LGS: [
    'Friendship', 'Teen Life', 'In the Kitchen', 'On the Phone', 'The Internet', 'Adventures', 'Tourism', 'Chores',
    'Science', 'Natural Forces', 'Okuma ve görsel yorumlama', 'Diyalog soruları',
  ],
};
