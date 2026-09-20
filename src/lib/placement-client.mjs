export const PLACEMENT_CHECK_TIMEOUT_MS = 8_000;

export async function checkPlacementAnswer(fetchImpl, id, selectedIndex, {
  timeoutMs = PLACEMENT_CHECK_TIMEOUT_MS,
  AbortControllerImpl = globalThis.AbortController,
  setTimeoutImpl = globalThis.setTimeout,
  clearTimeoutImpl = globalThis.clearTimeout,
} = {}) {
  const controller = new AbortControllerImpl();
  const timeoutId = setTimeoutImpl(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('/api/placement/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, selectedIndex }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('check');
    return await response.json();
  } finally {
    clearTimeoutImpl(timeoutId);
  }
}
