/**
 * arweave-permanence.js
 * Lightweight helpers for attaching immutable archive metadata to marketplace items.
 */

const ARWEAVE_TX_RE = /^[a-zA-Z0-9_-]{43}$/;

function _toString(/** @type {any} */ value) {
  return String(value || '').trim();
}

function _slug(/** @type {any} */ value) {
  return _toString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'asset';
}

export function isArweaveTxId(/** @type {any} */ value) {
  return ARWEAVE_TX_RE.test(_toString(value));
}

export function extractArweaveTxId(/** @type {any} */ value) {
  const raw = _toString(value);
  if (!raw) return '';

  if (isArweaveTxId(raw)) return raw;

  const arScheme = raw.match(/^ar:\/\/([a-zA-Z0-9_-]{43})$/i);
  if (arScheme) return arScheme[1];

  const netPath = raw.match(/^https?:\/\/arweave\.net\/([a-zA-Z0-9_-]{43})(?:[/?#].*)?$/i);
  if (netPath) return netPath[1];

  const genericPath = raw.match(/^https?:\/\/[\w.-]+\/([a-zA-Z0-9_-]{43})(?:[/?#].*)?$/i);
  if (genericPath && isArweaveTxId(genericPath[1])) return genericPath[1];

  return '';
}

export function toArweaveUri(/** @type {any} */ value) {
  const txId = extractArweaveTxId(value);
  return txId ? `ar://${txId}` : '';
}

export function toArweaveGatewayUrl(/** @type {any} */ value, /** @type {any} */ gateway = 'https://arweave.net') {
  const txId = extractArweaveTxId(value);
  if (!txId) return '';
  return `${String(gateway || 'https://arweave.net').replace(/\/$/, '')}/${txId}`;
}

export function buildPermanenceMetadata(/** @type {any} */ payload = {}) {
  const txId = extractArweaveTxId(payload.imageUri);
  const uri = txId ? `ar://${txId}` : '';

  return {
    layer: 'arweave-archive',
    status: txId ? 'anchored' : 'pending',
    txId: txId || null,
    uri: uri || null,
    gatewayUrl: txId ? toArweaveGatewayUrl(txId) : null,
    recommendedForCollectionType: String(payload.collectionType || '').toLowerCase(),
    createdAt: new Date().toISOString(),
    fairUse: {
      mode: String(payload.fairUseMode || payload.assetIntent || 'promo').toLowerCase(),
      note: String(payload.fairUseNote || '').trim().slice(0, 240)
    },
    provenance: {
      sourceType: String(payload.sourceType || 'creator-studio').trim().slice(0, 40),
      sourceFormat: String(payload.sourceFormat || '').trim().slice(0, 80),
      note: String(payload.provenanceNote || '').trim().slice(0, 240)
    },
    source: {
      title: _toString(payload.title),
      creatorWallet: _toString(payload.creatorWallet),
      descriptionPreview: _toString(payload.description).slice(0, 140)
    }
  };
}

export function buildArweaveReadyManifest(/** @type {any} */ payload = {}) {
  const permanence = payload.permanence || buildPermanenceMetadata(payload);
  const mediaUri = _toString(payload.imageUri || permanence.uri || permanence.gatewayUrl || '');
  return {
    schema: 'eon/utility-manifest/v1',
    manifestVersion: 1,
    generatedAt: new Date().toISOString(),
    asset: {
      id: _toString(payload.listingId || payload.assetId || `asset-${Date.now()}`),
      type: _toString(payload.collectionType || payload.type || 'nft').toLowerCase(),
      title: _toString(payload.title),
      description: _toString(payload.description),
      provenance: {
        sourceType: _toString(payload.sourceType || 'creator-studio'),
        sourceFormat: _toString(payload.sourceFormat || ''),
        note: _toString(payload.provenanceNote || '')
      },
      media: {
        sourceUri: mediaUri || null,
        arweaveUri: permanence.uri || toArweaveUri(mediaUri) || null,
        txId: permanence.txId || extractArweaveTxId(mediaUri) || null,
        gatewayUrl: permanence.gatewayUrl || toArweaveGatewayUrl(mediaUri) || null
      }
    },
    creator: {
      wallet: _toString(payload.creatorWallet || permanence?.source?.creatorWallet),
      name: _toString(payload.creatorName || '')
    },
    pricing: {
      amount: Number(payload.priceEon || 0),
      currency: _toString(payload.currency || 'eon')
    },
    utility: payload.utilityWrapper || null,
    permanence
  };
}

export function downloadJsonManifest(/** @type {any} */ manifest, /** @type {any} */ fileName = '') {
  if (typeof document === 'undefined') return false;
  try {
    const title = _slug(fileName || manifest?.asset?.title || manifest?.asset?.id || 'manifest');
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const /** @type {any} */
a = document.createElement('a');
    a.href = url;
    a.download = `${title}.arweave-manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
