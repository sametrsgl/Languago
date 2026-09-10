export type SkillKey = 'vocabulary' | 'grammar' | 'reading' | 'game' | 'speaking' | 'material';

export type LearningLevel = {
  key: string;
  label: string;
  audience: string;
  canDo: string;
  nextAction: string;
};

export type LearningSkill = {
  key: SkillKey;
  label: string;
  objective: string;
  route: string;
  activityType: string;
  replayStrategy: string;
};

export const V2_LEVELS: LearningLevel[] = [
  { key: 'a1', label: 'A1 · Başlangıç', audience: 'Yeni başlayanlar', canDo: 'Günlük ifadeleri tanır, basit cümleler kurar.', nextAction: 'Rutinler, temel kelime ve kısa okuma metinleriyle başla.' },
  { key: 'a2', label: 'A2 · Temel', audience: 'Temel bilgisi olanlar', canDo: 'Tanıdık konularda kısa konuşmaları ve metinleri takip eder.', nextAction: 'Geçmiş zaman, yön tarifleri ve durum temelli pratiklere geç.' },
  { key: 'b1', label: 'B1 · Orta', audience: 'Bağımsız öğrenenler', canDo: 'Deneyimlerini anlatır, ana fikri bulur, gerekçe verir.', nextAction: 'Paragraf okuma, zaman karşılaştırmaları ve akıcılık görevleri çöz.' },
  { key: 'b2', label: 'B2 · Orta-Üstü', audience: 'Akademik/iş hedefi olanlar', canDo: 'Soyut konuları tartışır, ayrıntılı metinleri yorumlar.', nextAction: 'Akademik kelime, bağlaçlar ve çıkarım sorularını çalış.' },
  { key: 'c1', label: 'C1 · İleri', audience: 'İleri düzey kullanıcılar', canDo: 'Nüanslı anlamları ayırt eder, karmaşık metinleri değerlendirir.', nextAction: 'İleri yapı, söylem bağlayıcıları ve sınav tarzı okuma pratiği yap.' },
  { key: 'c2', label: 'C2 · Usta', audience: 'Çok ileri düzey', canDo: 'Yoğun ve soyut metinlerde ince anlam farklarını takip eder.', nextAction: 'Uzun okuma, akademik kelime ve eleştirel çıkarım pratikleri yap.' },
];

export const V2_SKILLS: LearningSkill[] = [
  {
    key: 'vocabulary',
    label: 'Kelime',
    objective: 'Kelimeyi anlam, örnek cümle ve aktif hatırlama ile öğrenmek.',
    route: '/dashboard/kelimeler',
    activityType: 'Flashcard + tekrar + cümle tamamlama',
    replayStrategy: 'Bilmediklerim filtresi ve tekrar modu ile zayıf kelimelere dön.',
  },
  {
    key: 'grammar',
    label: 'Dilbilgisi',
    objective: 'Tek bir hedef yapıyı açıklama, kontrollü pratik ve kısa testle pekiştirmek.',
    route: '/dashboard/dilbilgisi',
    activityType: 'Ders + MCQ + boşluk doldurma + eşleştirme',
    replayStrategy: 'Aynı ünitede yanlış yapılan soru tiplerine kısa geri bildirimle dön.',
  },
  {
    key: 'reading',
    label: 'Okuma',
    objective: 'Seviyeye uygun metinde ana fikir, detay, kelime ve çıkarım becerisi geliştirmek.',
    route: '/dashboard/okuma',
    activityType: 'Metin + anlama soruları',
    replayStrategy: 'Bir sonraki metne geçmeden önce yanlış cevaplanan soru türünü gözden geçir.',
  },
  {
    key: 'game',
    label: 'Oyunlar',
    objective: 'Öğrenilen kelime veya dilbilgisini hızlı, odaklı ve tekrar edilebilir görevlerle pekiştirmek.',
    route: '/dashboard/oyunlar',
    activityType: 'Quiz, yazım, sınıf karşılaşması',
    replayStrategy: 'Yakın zamanda çıkan soruları azalt, konu havuzu bitince en eski görülenlere dön.',
  },
];

export function levelByKey(key: string | undefined) {
  return V2_LEVELS.find((level) => level.key === key);
}

export function skillByKey(key: SkillKey) {
  return V2_SKILLS.find((skill) => skill.key === key)!;
}

export function nextStepForSkill(key: SkillKey) {
  const skill = skillByKey(key);
  if (key === 'vocabulary') return { label: 'Dilbilgisiyle pekiştir', href: '/dashboard/dilbilgisi' };
  if (key === 'grammar') return { label: 'Okumada kullan', href: '/dashboard/okuma' };
  if (key === 'reading') return { label: 'Oyunla tekrar et', href: '/dashboard/oyunlar' };
  return { label: 'Öğrenim yoluna dön', href: '/dashboard/yol' };
}
