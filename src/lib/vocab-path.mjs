export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const QUESTION_COUNTS = [16, 16, 14, 14, 10, 10];
export const pathStepTypes = ['preview', 'matching', 'meaning', 'cloze', 'collocation', 'dialogue', 'sorting', 'recall', 'reading', 'mission'];

const DIAGNOSTIC_MEANINGS = {
  a: 'bir; herhangi bir', about: 'hakkında', above: 'üstünde; yukarıda', across: 'bir yandan diğer yana', action: 'eylem; harekete geçme', activity: 'etkinlik; faaliyet', actor: 'oyuncu', actress: 'kadın oyuncu', add: 'eklemek; ilave etmek', adult: 'yetişkin', advice: 'tavsiye; öğüt', afraid: 'korkmuş; korkan', after: 'sonra; ardından', afternoon: 'öğleden sonra', again: 'tekrar; yeniden', ago: 'önce; ... önce',
  act: 'harekete geçmek; davranmak', active: 'aktif; hareketli', actually: 'aslında; gerçekte', advantage: 'avantaj; üstünlük', adventure: 'macera', advertise: 'reklamını yapmak; tanıtmak', advertisement: 'reklam; ilan', advertising: 'reklamcılık', affect: 'etkilemek', against: 'karşı; aleyhinde', ah: 'şaşkınlık, memnuniyet veya sempati ünlemi', airline: 'havayolu şirketi', alive: 'hayatta; canlı', 'all right': 'tamam mı; anlaşıldı mı', allow: 'izin vermek', almost: 'neredeyse; az kalsın',
  agreement: 'anlaşma; mutabakat', ahead: 'ileride; önde', aim: 'amaçlamak; hedeflemek', album: 'fotoğraf veya pul albümü', alcohol: 'alkol; alkollü içecek', alcoholic: 'alkollü; alkol içeren', amazed: 'çok şaşırmış', ambition: 'hırs; ulaşılmak istenen hedef', ambitious: 'hırslı; başarılı olmaya kararlı', analyse: 'analiz etmek; incelemek', analysis: 'analiz; ayrıntılı inceleme', announce: 'duyurmak; ilan etmek', announcement: 'duyuru; ilan', annoy: 'canını sıkmak; kızdırmak',
  actual: 'gerçek; fiilî', adapt: 'uyum sağlamak; uyarlamak', addiction: 'bağımlılık', additional: 'ek; ilave', additionally: 'ayrıca; ek olarak', address: 'bir sorunu ele almak', adequate: 'yeterli; amaca uygun', adequately: 'yeterli biçimde', adjust: 'ayarlamak; uyarlamak', administration: 'yönetim; idare', adopt: 'evlat edinmek', advance: 'ilerlemek; gelişmek', affair: 'kamuya açık olay; siyasi mesele', affordable: 'uygun fiyatlı; karşılanabilir',
  adjustment: 'ayarlama; küçük düzeltme', administer: 'yönetmek; idare etmek', administrative: 'idari; yönetimle ilgili', administrator: 'yönetici; idareci', admission: 'kabul; giriş izni', adolescent: 'ergen', adoption: 'evlat edinme', adverse: 'olumsuz; ters', advocate: 'kamuya açıkça desteklemek; savunmak', aesthetic: 'estetikle ilgili',
  merger: 'birleşme; şirket birleşmesi', merit: 'liyakat; övgü veya ödülü hak eden nitelik', methodology: 'yöntem bilimi; yöntemler bütünü', notorious: 'kötü şöhretli', parameter: 'parametre; sınırlandırıcı ölçüt', phase: 'aşama; evre', plane: 'uçak', practitioner: 'meslek uygulayıcısı; özellikle doktor veya hukukçu', predecessor: 'önceki görev sahibi; selef', proposition: 'öneri; özellikle iş alanında eylem planı',
};

function meaningFor(word) {
  return DIAGNOSTIC_MEANINGS[word.w] || word.t;
}

const STEP_META = [
  ['Ön izleme', 'Kısa bağlamı oku ve kelimeleri fark et.', 'Bir günün planını ve hedef kelimeleri birlikte gör.'],
  ['Eşleştir', 'İngilizce kelimeleri anlamlarıyla eşleştir.', 'Bir kafede sipariş verirken doğru ifadeyi bul.'],
  ['Anlam seç', 'Anlamı bağlamdan seç; sadece ezberleme.', 'Yeni bir iş arkadaşına kendini tanıtırken doğru kelimeyi seç.'],
  ['Boşluğu doldur', 'Kelimeyi cümlenin içine geri çağır.', 'Bir seyahat rezervasyonunu tamamla.'],
  ['Birlikte kullan', 'Doğal eşdizimleri ve kelime ortaklarını fark et.', 'İş e-postasında doğal ifadeleri birleştir.'],
  ['Diyalog', 'Gerçek konuşmada en uygun cevabı seç.', 'Restoranda bir sorun yaşadığında konuşmayı sürdür.'],
  ['Sırala', 'Kelimeleri anlam alanlarına ve görevlere ayır.', 'Havalimanında bilgi, hareket ve sorun kelimelerini ayır.'],
  ['Hatırla', 'İpucundan İngilizce kelimeyi üret.', 'Günlük hayatından bir mesaj yazarken kelimeyi kullan.'],
  ['Okuma', 'Kısa, anlaşılır bir metinde kelimeleri çöz.', 'Bir ev ilanını ve mahalle duyurusunu oku.'],
  ['Görev', 'Kelimeyi gerçek bir iletişim amacında kullan.', 'Bir rezervasyonu değiştir, yardım iste veya kararını açıkla.'],
];


function cleanWord(word) {
  return {
    w: String(word?.w || '').trim(),
    t: String(word?.t || '').trim(),
    d: String(word?.d || '').trim(),
    e: String(word?.e || '').trim(),
    p: String(word?.p || '').trim(),
    levels: Array.isArray(word?.levels) ? word.levels : [],
  };
}

function hash(value) {
  let h = 2166136261;
  for (const char of String(value)) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rotate(items, offset) {
  if (!items.length) return [];
  const start = offset % items.length;
  return items.slice(start).concat(items.slice(0, start));
}

function distractors(word, candidates, count = 3) {
  const value = meaningFor(word);
  const ordered = candidates
    .filter((item) => item.w !== word.w && meaningFor(item) && meaningFor(item) !== value)
    .sort((a, b) => hash(`${word.w}:${a.w}`) - hash(`${word.w}:${b.w}`));
  return ordered.slice(0, count).map(meaningFor);
}

export function buildMeaningOptions(target, candidates = [], count = 4) {
  const correct = meaningFor(target);
  const distractorMeanings = [];
  const seen = new Set([correct]);
  const ordered = candidates
    .filter((item) => item.w !== target.w && meaningFor(item))
    .sort((a, b) => hash(`${target.w}:${a.w}`) - hash(`${target.w}:${b.w}`));
  for (const item of ordered) {
    const meaning = meaningFor(item);
    if (seen.has(meaning)) continue;
    seen.add(meaning);
    distractorMeanings.push(meaning);
    if (distractorMeanings.length >= Math.max(0, count - 1)) break;
  }
  return [correct, ...distractorMeanings];
}

function seededOrder(items, seed) {
  return [...items].sort((a, b) => hash(`${seed}:${a.w}`) - hash(`${seed}:${b.w}`));
}

function makeQuestion(word, level, index, candidates) {
  const mode = index % 4;
  const correct = meaningFor(word);
  const options = rotate([correct, ...distractors(word, candidates)], hash(`options:${word.w}:${index}`));
  const answer = options.indexOf(correct);
  const example = word.e || `I used the word “${word.w}” in a sentence.`;
  const prompt = mode === 2
    ? `“${word.w}” kelimesi bu cümlede hangi anlamda kullanılmıştır? ${example}`
    : `“${word.w}” kelimesinin Türkçe karşılığı hangisi?`;
  return { id: `vocab-diagnostic-${level.toLowerCase()}-${index}`, level, word: word.w, prompt, options, answer, mode };
}

export function createVocabularyDiagnostic(inputWords = []) {
  const words = inputWords.map(cleanWord).filter((word) => word.w && word.t);
  const questions = [];
  CEFR_LEVELS.forEach((level, levelIndex) => {
    const candidates = words.filter((word) => word.levels.includes(level));
    const selected = seededOrder(candidates, `diagnostic:${level}`).slice(0, QUESTION_COUNTS[levelIndex]);
    selected.forEach((word, index) => questions.push(makeQuestion(word, level, index, candidates)));
  });
  return questions;
}

/**
 * Select the next vocabulary diagnostic item from evidence rather than array order.
 * The first 24 items provide four anchor items per CEFR band; the remaining items
 * follow the learner's recent performance one band at a time. This gives broad
 * coverage while still adapting difficulty.
 */
export function selectNextVocabularyQuestion(questions = [], responses = [], askedIds = []) {
  const asked = new Set(askedIds.map(String));
  const available = questions.filter((question) => !asked.has(String(question.id)));
  if (!available.length) return null;
  const counts = Object.fromEntries(CEFR_LEVELS.map((level) => [level, 0]));
  for (const response of responses) {
    const question = questions.find((item) => item.id === response.id);
    if (question && counts[question.level] !== undefined) counts[question.level] += 1;
  }
  const anchorLevel = CEFR_LEVELS.find((level) => counts[level] < 4);
  const last = responses.at(-1);
  let targetIndex = anchorLevel ? CEFR_LEVELS.indexOf(anchorLevel) : 0;
  if (!anchorLevel && last) {
    const lastQuestion = questions.find((item) => item.id === last.id);
    const lastIndex = lastQuestion ? CEFR_LEVELS.indexOf(lastQuestion.level) : 0;
    targetIndex = Math.max(0, Math.min(CEFR_LEVELS.length - 1, lastIndex + (last.correct ? 1 : -1)));
  }
  const targetLevel = CEFR_LEVELS[targetIndex];
  return available.find((question) => question.level === targetLevel)
    || available.find((question) => Math.abs(CEFR_LEVELS.indexOf(question.level) - targetIndex) === 1)
    || available[0];
}

export function createAssessmentVocabulary(wordData = {}, limit = 5000) {
  const records = recordsFromWordData(wordData)
    .filter((word) => word.w && word.t && word.levels.length)
    .sort((a, b) => hash(`assessment:${a.w}`) - hash(`assessment:${b.w}`));
  const selected = records.slice(0, Math.max(0, Math.min(5000, Number(limit) || 0)));
  const questions = [];
  for (const [index, word] of selected.entries()) {
    const level = word.levels.find((item) => CEFR_LEVELS.includes(item)) || 'A1';
    const candidates = records.filter((item) => item.levels.includes(level));
    const options = buildMeaningOptions(word, candidates, 4);
    if (options.length < 2) continue;
    const rotated = rotate(options, index);
    questions.push({
      id: `assessment-vocab-${String(index + 1).padStart(5, '0')}`,
      sourceId: `vocabulary-${word.w}`,
      level,
      source: 'vocabulary',
      passageTitle: null,
      prompt: `“${word.w}” kelimesinin Türkçe karşılığı hangisi?`,
      options: rotated,
      answer: rotated.indexOf(options[0]),
      why: word.e ? `Bağlam örneği: ${word.e}` : '',
    });
  }
  return questions;
}

export function scoreVocabularyDiagnostic(questions, answers) {
  const stats = Object.fromEntries(CEFR_LEVELS.map((level) => [level, { asked: 0, correct: 0 }]));
  const responseRows = Array.isArray(answers) && answers.every((answer) => answer && typeof answer === 'object')
    ? answers
    : questions.map((question, index) => ({ id: question.id, answer: answers?.[index] }));
  const questionById = new Map(questions.map((question) => [question.id, question]));
  let answered = 0;
  for (const response of responseRows) {
    const question = questionById.get(response?.id);
    const selected = Number(response?.answer);
    if (!question || !Number.isInteger(selected) || selected < 0 || selected > 3) continue;
    const row = stats[question.level];
    if (!row) continue;
    row.asked += 1;
    answered += 1;
    if (selected === question.answer) row.correct += 1;
  }
  let level = 'A1';
  for (const candidate of CEFR_LEVELS) {
    const row = stats[candidate];
    if (row.asked && row.correct / row.asked >= 0.6) level = candidate;
  }
  const target = stats[level];
  const ratio = target.asked ? target.correct / target.asked : 0;
  const evidence = Math.min(1, answered / 80);
  const confidence = Math.round(Math.min(0.99, evidence * 0.55 + Math.abs(ratio - 0.5) * 0.9) * 100) / 100;
  return { level, confidence, questionsAnswered: answered, stats };
}

export function recordsFromWordData(wordData = {}) {
  const sets = wordData?.sets && typeof wordData.sets === 'object' ? wordData.sets : {};
  const byWord = {};
  for (const [level, words] of Object.entries(sets)) {
    const normalized = String(level).toUpperCase();
    for (const word of Array.isArray(words) ? words : []) {
      const key = String(word);
      (byWord[key] ||= []).push(normalized);
    }
  }
  return Object.values(wordData?.words || {}).map((word) => ({
    ...cleanWord(word),
    levels: byWord[word.w] || [],
  }));
}

export function buildVocabularyPath(inputWords = [], level = 'A1') {
  const words = inputWords.map(cleanWord).filter((word) => word.w && (word.t || word.d));
  const index = Math.max(0, CEFR_LEVELS.indexOf(level));
  const allowed = new Set([CEFR_LEVELS[index], CEFR_LEVELS[Math.max(0, index - 1)]]);
  const selected = words.filter((word) => word.levels.some((item) => allowed.has(item)));
  const pathWords = rotate(selected, hash(`path:${level}`)).slice(0, 100);
  const safeWords = pathWords.length ? pathWords : words.slice(0, 100);
  const chunkSize = Math.max(1, Math.ceil(safeWords.length / pathStepTypes.length));
  const steps = pathStepTypes.map((type, index) => {
    const chunk = safeWords.slice(index * chunkSize, index * chunkSize + chunkSize);
    return {
      index: index + 1,
      type,
      title: STEP_META[index][0],
      objective: STEP_META[index][1],
      scenario: STEP_META[index][2],
      words: chunk,
    };
  }).filter((step) => step.words.length);
  return { level, steps, words: safeWords };
}

/**
 * Build a path from evidence, not just the student's nominal level.
 * Review rows are deliberately optional: a new student still gets a useful
 * route when the review_items migration has not been applied yet.
 *
 * The ranking favors due/lapsed items, then unseen items, and finally items
 * that have been repeatedly answered easily. This makes the next session
 * useful without pretending that a single diagnostic is mastery evidence.
 */
export function buildPersonalizedVocabularyPath(inputWords = [], level = 'A1', activity = {}) {
  const base = buildVocabularyPath(inputWords, level);
  const reviews = Array.isArray(activity.reviews) ? activity.reviews : [];
  const reviewById = new Map(reviews.map((item) => [String(item.itemId ?? item.item_id ?? ''), item]));
  const now = Number(activity.now ?? Date.now());
  const ranked = base.words.map((word, index) => {
    const item = reviewById.get(`word:${word.w}`) || reviewById.get(word.w);
    const rawDue = item?.dueAt ?? item?.due_at ?? 0;
    const dueTime = typeof rawDue === 'string' ? Date.parse(rawDue) : Number(rawDue);
    const due = item && Number.isFinite(dueTime) && dueTime <= now;
    const lapses = Math.max(0, Number(item?.lapses ?? 0));
    const repetitions = Math.max(0, Number(item?.repetitions ?? 0));
    const lastRating = item?.lastRating ?? item?.last_rating;
    const unseen = !item;
    const priority = (due ? 100 : 0) + (lapses * 12) + (unseen ? 20 : 0) + (lastRating === 0 ? 25 : 0) - (lastRating === 3 ? 8 : 0) - (repetitions * 0.1) - index * 0.001;
    return {
      ...word,
      itemId: `word:${word.w}`,
      review: item ? { due, lapses, repetitions, lastRating } : null,
      priority,
      reason: due || lapses > 0 || lastRating === 0 ? 'Öncelikli tekrar' : unseen ? 'Yeni kelime' : 'Pekiştirme',
    };
  }).sort((a, b) => b.priority - a.priority || a.w.localeCompare(b.w));
  const selected = ranked.slice(0, Math.min(60, Math.max(20, ranked.length)));
  const chunkSize = Math.max(1, Math.ceil(selected.length / pathStepTypes.length));
  const steps = pathStepTypes.map((type, index) => ({
    index: index + 1,
    type,
    title: STEP_META[index][0],
    objective: STEP_META[index][1],
    scenario: STEP_META[index][2],
    words: selected.slice(index * chunkSize, index * chunkSize + chunkSize),
  })).filter((step) => step.words.length);
  return {
    ...base,
    words: selected,
    steps,
    personalized: true,
    focus: {
      due: selected.filter((word) => word.review?.due).length,
      lapsed: selected.filter((word) => (word.review?.lapses ?? 0) > 0).length,
      new: selected.filter((word) => !word.review).length,
    },
  };
}
