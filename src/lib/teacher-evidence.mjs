const finitePercent = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;

export function moduleEvidence(entry) {
  const payload = entry?.payload && typeof entry.payload === 'object' ? entry.payload : null;
  if (!payload) {
    return {
      label: 'Kanıt bekleniyor',
      tone: 'neutral',
      next: 'Öğrenci bu modülde geçerli bir çalışma tamamladığında burada görünür.',
    };
  }
  const completed = Number.isInteger(payload.completed) && payload.completed >= 0 ? payload.completed : null;
  const total = Number.isInteger(payload.total) && payload.total > 0 ? payload.total : null;
  const correct = Number.isInteger(payload.correct) && payload.correct >= 0 ? payload.correct : null;
  if (completed !== null && total !== null && completed <= total && correct !== null && correct <= completed) {
    const accuracy = Math.round((correct / completed) * 100);
    const remaining = total - completed;
    return {
      label: `${completed}/${total} tamamlandı · %${accuracy} doğruluk`,
      tone: completed === total ? 'complete' : 'progress',
      next: remaining ? `Kalan ${remaining} etkinliği tamamla; ardından yanlışlarını yeniden dene.` : 'Yanlışlarını yeniden dene veya başka bir beceriye geç.',
    };
  }
  if (finitePercent(payload.percent)) {
    return {
      label: `%${Math.round(payload.percent)} tamamlandı`,
      tone: payload.percent >= 100 ? 'complete' : 'progress',
      next: payload.percent >= 100 ? 'Yanlışlarını yeniden dene veya başka bir beceriye geç.' : 'Bir sonraki etkinliği tamamla.',
    };
  }
  return {
    label: 'Kanıt bekleniyor',
    tone: 'neutral',
    next: 'Öğrenci bu modülde geçerli bir çalışma tamamladığında burada görünür.',
  };
}
