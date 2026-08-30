const appWin = /** @type {any} */ (typeof window !== 'undefined' ? window : globalThis);

function sanitizeFileToken(/** @type {any} */ value = '') {
  const cleaned = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return cleaned || 'result';
}

function toSafeScale(/** @type {any} */ rect, /** @type {any} */ preferredScale, /** @type {any} */ maxPixels) {
  let scale = Math.max(1, Math.min(3, Number(preferredScale) || 2));
  while (rect.width * rect.height * scale * scale > maxPixels && scale > 1) {
    scale = Math.max(1, scale - 0.25);
  }
  return Number(scale.toFixed(2));
}

export async function exportShareCard(/** @type {any} */ cardEl, /** @type {any} */ {
  fileToken = 'result',
  backgroundColor = '#1a2236',
  preferredScale = 2,
  maxPixels = 6500000
} = {}) {
  if (!cardEl) {
    return { ok: false, reason: 'missing-element' };
  }

  if (typeof appWin.html2canvas !== 'function') {
    return { ok: false, reason: 'missing-html2canvas' };
  }

  const rect = cardEl.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return { ok: false, reason: 'invalid-dimensions' };
  }

  const scale = toSafeScale(rect, preferredScale, maxPixels);
  const canvas = await appWin.html2canvas(cardEl, {
    backgroundColor,
    scale,
    useCORS: true,
    logging: false
  });

  return {
    ok: true,
    canvas,
    filename: `eonapp-${sanitizeFileToken(fileToken)}-result.png`
  };
}

export function downloadCanvas(/** @type {any} */ canvas, /** @type {any} */ filename) {
  if (!canvas) {
    return false;
  }
  const /** @type {any} */
a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename || 'eonapp-result.png';
  a.click();
  return true;
}
