// Grammar topic of each level-test grammar item (same order as grammar.mjs:
// A1 ×24, A2 ×24, B1 ×24, B2 ×24, C1 ×24, C2 ×24). The level test reports
// right/wrong per topic; the learning path uses it to mark topics the
// learner already knows or finds hard.
export const TOPICS = {
  'be': '“to be” (am / is / are)',
  'past-be': 'was / were',
  'there-is': 'there is / there are',
  'articles': 'a / an / the, çoğul isimler',
  'possessives': 'iyelik (my, your, ’s)',
  'pronouns': 'zamirler (me, mine…)',
  'present-simple': 'geniş zaman',
  'present-continuous': 'şimdiki zaman',
  'have-got': 'have got',
  'can': 'can / can’t',
  'imperatives': 'emir cümleleri',
  'prepositions': 'edatlar (in, on, at…)',
  'quantifiers': 'much / many / some / any',
  'adverbs': 'zarflar, too / enough',
  'questions': 'soru yapıları',
  'past-simple': 'geçmiş zaman',
  'past-continuous': 'past continuous',
  'past-perfect': 'past perfect',
  'past-habits': 'used to',
  'present-perfect': 'present perfect',
  'future': 'gelecek zaman (will / going to)',
  'comparatives': 'karşılaştırma',
  'modals': 'modal fiiller',
  'gerund-inf': '-ing / to + fiil',
  'conditionals': 'koşul cümleleri',
  'passive': 'edilgen yapı',
  'relative': 'sıfat cümlecikleri (who, which…)',
  'reported': 'dolaylı anlatım',
  'linking': 'bağlaçlar (although, despite…)',
  'wish': 'wish / would rather / it’s time',
  'causative': 'ettirgen yapı (have sth done)',
  'participles': 'ortaç yapıları',
  'inversion': 'devrik cümle',
  'cleft': 'vurgu yapıları (It was… / What…)',
  'subjunctive': 'subjunctive',
};

export const TAGS = [
  // A1
  'be', 'there-is', 'present-simple', 'present-simple', 'present-simple', 'articles', 'present-continuous', 'possessives',
  'there-is', 'can', 'past-be', 'prepositions', 'prepositions', 'articles', 'pronouns', 'present-simple',
  'present-simple', 'have-got', 'imperatives', 'present-simple', 'pronouns', 'quantifiers', 'past-be', 'present-continuous',
  // A2
  'past-simple', 'past-simple', 'past-continuous', 'comparatives', 'comparatives', 'future', 'present-perfect', 'present-perfect',
  'modals', 'quantifiers', 'quantifiers', 'adverbs', 'adverbs', 'future', 'future', 'modals',
  'gerund-inf', 'gerund-inf', 'questions', 'comparatives', 'present-perfect', 'present-simple', 'comparatives', 'present-perfect',
  // B1
  'present-perfect', 'conditionals', 'conditionals', 'passive', 'relative', 'past-habits', 'reported', 'past-perfect',
  'reported', 'modals', 'modals', 'past-habits', 'linking', 'questions', 'gerund-inf', 'present-perfect',
  'relative', 'linking', 'conditionals', 'passive', 'future', 'comparatives', 'linking', 'reported',
  // B2
  'conditionals', 'wish', 'modals', 'causative', 'passive', 'participles', 'linking', 'future',
  'conditionals', 'modals', 'wish', 'wish', 'gerund-inf', 'comparatives', 'gerund-inf', 'questions',
  'relative', 'conditionals', 'past-habits', 'gerund-inf', 'passive', 'conditionals', 'inversion', 'modals',
  // C1
  'inversion', 'cleft', 'subjunctive', 'cleft', 'inversion', 'modals', 'inversion', 'modals',
  'wish', 'conditionals', 'inversion', 'relative', 'wish', 'relative', 'inversion', 'cleft',
  'conditionals', 'cleft', 'wish', 'linking', 'conditionals', 'gerund-inf', 'inversion', 'passive',
  // C2
  'conditionals', 'linking', 'modals', 'linking', 'future', 'inversion', 'inversion', 'linking',
  'subjunctive', 'conditionals', 'inversion', 'linking', 'inversion', 'comparatives', 'wish', 'relative',
  'subjunctive', 'inversion', 'subjunctive', 'conditionals', 'linking', 'prepositions', 'linking', 'conditionals',
];

// A1 path topics (syllabus ids) → the level-test topics that show them.
export const A1_TOPIC_MAP = {
  g01: ['be'], g02: ['be'], g03: ['articles'], g04: [], g05: ['possessives'], g06: ['present-simple'], g07: ['present-simple'],
  g08: ['present-simple'], g09: ['adverbs'], g10: ['questions'], g11: ['there-is'], g12: ['prepositions'], g13: ['prepositions'],
  g14: ['can'], g15: ['imperatives'], g16: ['pronouns'], g17: ['present-continuous'], g18: ['present-continuous', 'present-simple'],
  g19: ['quantifiers'], g20: ['gerund-inf'], g21: ['past-be'], g22: ['past-simple'], g23: ['past-simple'], g24: ['future'],
};
