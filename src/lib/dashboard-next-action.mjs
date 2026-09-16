const MODULE_ACTIONS = Object.freeze({
  vocab: { href: '/dashboard/kelimeler', label: 'Kelime çalışmasına başla' },
  grammar: { href: '/dashboard/dilbilgisi', label: 'Dilbilgisi çalışmasına geç' },
  reading: { href: '/dashboard/okuma', label: 'Okuma çalışmasına geç' },
  game: { href: '/dashboard/oyunlar', label: 'Oyunla tekrar et' },
});

function positiveCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

export function getNextLearningAction({ progress = [], steps = [] } = {}) {
  const vocab = progress.find((row) => row?.module === 'vocab');
  const payload = vocab?.payload && typeof vocab.payload === 'object' ? vocab.payload : {};
  const dueCount = positiveCount(payload.dueCount ?? payload.reviewDue ?? payload.due);
  if (dueCount > 0) {
    return {
      ...MODULE_ACTIONS.vocab,
      label: 'Kelime tekrarını başlat',
      reason: `${dueCount} kelimenin tekrar zamanı geldi.`,
      evidence: 'due',
    };
  }

  if (progress.length === 0) {
    return {
      href: '/dashboard/yol',
      label: 'Kelime tanılamasını başlat',
      reason: 'Henüz öğrenme kanıtın yok; önce kelime tanılamasını tamamlayarak kişisel yolunu aç.',
      evidence: 'unseen',
    };
  }

  const next = steps.find((step) => !step?.done);
  if (next && MODULE_ACTIONS[next.module]) {
    const action = MODULE_ACTIONS[next.module];
    return { ...action, reason: `${action.label} için sıradaki adımın hazır.`, evidence: 'next-module' };
  }

  return {
    ...MODULE_ACTIONS.vocab,
    label: 'Kısa bir tekrar yap',
    reason: 'Bugün yeni bir hedef yok; öğrendiklerini taze tutmak için kısa tekrar yap.',
    evidence: 'recency',
  };
}
