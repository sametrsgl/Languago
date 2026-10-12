// Public word-list pages (/kelimeler): our own vocabulary cards (Turkish
// meaning, simple English explanation, example sentence) per CEFR level.
import a1 from '../data/vocab/a1.json';
import a2 from '../data/vocab/a2.json';
import b1 from '../data/vocab/b1.json';

export type Card = { id: string; word: string; pos: string; tr: string; en: string; ex: string };

export const WORD_LEVELS = [
  { slug: 'a1', level: 'A1', name: 'Başlangıç', cards: a1 as Card[],
    intro: 'A1, İngilizceye yeni başlayanların seviyesidir. Bu kelimelerle kendinizi tanıtır, ailenizi, gününüzü ve çevrenizi basit cümlelerle anlatırsınız.' },
  { slug: 'a2', level: 'A2', name: 'Temel', cards: a2 as Card[],
    intro: 'A2 seviyesinde günlük işlerinizi halledersiniz: alışveriş, yol sorma, geçmişte ne yaptığınızı ve planlarınızı anlatma. Bu liste o konuşmaların kelimeleridir.' },
  { slug: 'b1', level: 'B1', name: 'Orta', cards: b1 as Card[],
    intro: 'B1, “İngilizce konuşabiliyorum” denen eşiktir. İşte, okulda ve seyahatte fikrinizi söyler, deneyimlerinizi anlatır, basit metinleri rahat okursunuz.' },
];

const POS_TR: Record<string, string> = {
  noun: 'isim', verb: 'fiil', adjective: 'sıfat', adverb: 'zarf', preposition: 'edat', conjunction: 'bağlaç',
  determiner: 'belirleyici', pronoun: 'zamir', phrase: 'kalıp', 'phrasal verb': 'öbek fiil', number: 'sayı',
  exclamation: 'ünlem', 'modal verb': 'yardımcı fiil', 'auxiliary verb': 'yardımcı fiil',
};
export const posTr = (p: string) => POS_TR[p] || p;

/** Cards sorted A–Z and grouped by first letter (English alphabet). */
export function byLetter(cards: Card[]): { letter: string; cards: Card[] }[] {
  const sorted = [...cards].sort((x, y) => x.word.localeCompare(y.word, 'en', { sensitivity: 'base' }));
  const groups = new Map<string, Card[]>();
  for (const c of sorted) {
    const l = c.word.charAt(0).toUpperCase();
    const key = /[A-Z]/.test(l) ? l : '#';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  return [...groups].map(([letter, cards]) => ({ letter, cards }));
}
