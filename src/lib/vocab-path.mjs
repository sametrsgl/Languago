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

function makeQuestion(word, level, index, candidates) {
  const mode = index % 4;
  const correct = meaningFor(word);
  const options = rotate([correct, ...distractors(word, candidates)], index);
  const answer = options.indexOf(correct);
  const prompt = mode === 2
    ? `Bu kelimeyi doğru bağlamda seç: ${word.e || `I used the word “${word.w}” in a sentence.`}`
    : `“${word.w}” kelimesinin Türkçe karşılığı hangisi?`;
  return { id: `vocab-diagnostic-${level.toLowerCase()}-${index}`, level, word: word.w, prompt, options, answer, mode };
}

export function createVocabularyDiagnostic(inputWords = []) {
  const words = inputWords.map(cleanWord).filter((word) => word.w && word.t);
  const questions = [];
  CEFR_LEVELS.forEach((level, levelIndex) => {
    const candidates = words.filter((word) => word.levels.includes(level));
    const selected = rotate(candidates, levelIndex * 7).slice(0, QUESTION_COUNTS[levelIndex]);
    selected.forEach((word, index) => questions.push(makeQuestion(word, level, index, candidates)));
  });
  return questions;
}

export function scoreVocabularyDiagnostic(questions, answers) {
  const stats = Object.fromEntries(CEFR_LEVELS.map((level) => [level, { asked: 0, correct: 0 }]));
  questions.forEach((question, index) => {
    const row = stats[question.level];
    if (!row) return;
    row.asked += 1;
    if (Number(answers?.[index]) === question.answer) row.correct += 1;
  });
  let level = 'A1';
  for (const candidate of CEFR_LEVELS) {
    const row = stats[candidate];
    if (row.asked && row.correct / row.asked >= 0.6) level = candidate;
  }
  const target = stats[level];
  const ratio = target.asked ? target.correct / target.asked : 0;
  const evidence = Math.min(1, questions.length / 80);
  const confidence = Math.round(Math.min(0.99, evidence * 0.55 + Math.abs(ratio - 0.5) * 0.9) * 100) / 100;
  return { level, confidence, questionsAnswered: questions.length, stats };
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
