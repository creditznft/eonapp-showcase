/**
 * Creator receipts
 * ----------------
 * Build durable local receipts for Creator Studio media artifacts.
 */

/**
 * @typedef {Object} CreatorMediaReceiptInput
 * @property {string=} kind
 * @property {string=} createdAt
 * @property {string=} title
 * @property {string=} mediaUrl
 * @property {string=} manifestUrl
 * @property {string=} assetIntent
 * @property {string=} platform
 * @property {string=} format
 * @property {string=} aspect
 * @property {string=} receiptId
 * @property {Record<string, any>=} provenance
 * @property {Record<string, any>=} fairUse
 */

function toCompactHash(text = '') {
  let hash = 2166136261;
  const src = String(text || '');
  for (let i = 0; i < src.length; i += 1) {
    hash ^= src.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Build a durable creator-media receipt object.
 * @param {CreatorMediaReceiptInput} [input={}]
 * @returns {Record<string, any>}
 */
export function buildCreatorMediaReceipt(input = {}) {
  const kind = String(input.kind || 'video').trim().toLowerCase();
  const createdAt = String(input.createdAt || new Date().toISOString());
  const title = String(input.title || `${kind === 'music' ? 'Music' : 'Video'} artifact`).trim().slice(0, 140);
  const mediaUrl = String(input.mediaUrl || '').trim().slice(0, 500);
  const manifestUrl = String(input.manifestUrl || '').trim().slice(0, 500);
  const assetIntent = String(input.assetIntent || 'sale-ready').trim().toLowerCase() === 'promo' ? 'promo' : 'sale-ready';
  const provenance = input.provenance && typeof input.provenance === 'object' ? input.provenance : {};
  const fairUse = input.fairUse && typeof input.fairUse === 'object' ? input.fairUse : {};
  const receiptSeed = [
    kind,
    title,
    mediaUrl,
    manifestUrl,
    assetIntent,
    String(input.platform || ''),
    String(input.format || ''),
    String(input.aspect || ''),
    createdAt
  ].join('|');

  return {
    schema: 'creator-media-receipt/v1',
    receiptId: String(input.receiptId || `creator-${kind}-${Date.now()}`),
    createdAt,
    kind,
    title,
    format: String(input.format || '').trim(),
    platform: String(input.platform || '').trim(),
    aspect: String(input.aspect || '').trim(),
    mediaUrl,
    manifestUrl,
    assetIntent,
    provenance: {
      ...provenance,
      receiptHash: toCompactHash(receiptSeed)
    },
    fairUse: {
      ...fairUse,
      note: String(fairUse.note || '').trim()
    }
  };
}
