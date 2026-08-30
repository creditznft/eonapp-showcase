/**
 * arweave-upload.js
 *
 * W134 security posture:
 * Browser-side Irys uploads are intentionally paused because the current
 * @irys/web-upload + ethers transitive tree carries unresolved npm audit
 * advisories. The app keeps Arweave-ready manifest export, gateway helpers,
 * IPFS backup fallback, and upload history display available without shipping
 * the vulnerable uploader bundle to every visitor.
 */

import { buildArweaveReadyManifest, extractArweaveTxId, toArweaveGatewayUrl, toArweaveUri } from './arweave-permanence.js';

const HISTORY_KEY = 'eon:arweave:uploads:v1';
const HISTORY_MAX = 60;
const SECURITY_HOLD_REASON = 'Browser-side Arweave/Irys upload is paused while the upstream Irys/Ethers dependency chain clears npm audit advisories. Export the Arweave-ready manifest or use the server/CLI deploy path instead.';

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

function _safeParse(/** @type {any} */ raw, /** @type {any} */ fallback) {
  try {
    const parsed = JSON.parse(String(raw || ''));
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function _recordUploadHistory(/** @type {any} */ entry) {
  try {
    const history = _safeParse(localStorage.getItem(HISTORY_KEY), []);
    history.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      ...entry
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_MAX)));
  } catch {
    // best-effort only
  }
}

export function getArweaveUploadSecurityHoldReason() {
  return SECURITY_HOLD_REASON;
}

export function isArweaveUploadAvailable() {
  return false;
}

export function getArweaveUploadHistory() {
  try {
    const history = _safeParse(localStorage.getItem(HISTORY_KEY), []);
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

export async function uploadSourceToArweave() {
  throw new Error(SECURITY_HOLD_REASON);
}

export async function uploadPermanentBundle(/** @type {any} */ payload = {}, /** @type {any} */ options = {}) {
  const sourceUri = _toString(options.sourceUri || payload.imageUri || payload.mediaUri || '');
  const manifest = buildArweaveReadyManifest({
    ...payload,
    imageUri: sourceUri && !extractArweaveTxId(sourceUri) ? sourceUri : (payload.imageUri || sourceUri)
  });

  const fallbackId = `${_slug(payload.title || payload.listingId || 'manifest')}-${Date.now()}`;
  const result = {
    mediaUpload: null,
    manifestReceipt: null,
    manifest,
    mediaArweaveUri: extractArweaveTxId(sourceUri) ? toArweaveUri(extractArweaveTxId(sourceUri)) : null,
    manifestArweaveUri: null,
    manifestGatewayUrl: null,
    mediaGatewayUrl: extractArweaveTxId(sourceUri) ? toArweaveGatewayUrl(extractArweaveTxId(sourceUri)) : null,
    securityHold: true,
    reason: SECURITY_HOLD_REASON
  };

  _recordUploadHistory({
    title: payload.title || manifest.asset?.title || 'Untitled asset',
    collectionType: payload.collectionType || manifest.asset?.type || '',
    listingId: payload.listingId || manifest.asset?.id || fallbackId,
    creatorWallet: payload.creatorWallet || manifest.creator?.wallet || '',
    workflowType: payload.workflowType || '',
    uploadKind: options.uploadKind || payload.uploadKind || 'manifest-security-hold',
    mediaTxId: '',
    manifestTxId: '',
    mediaArweaveUri: result.mediaArweaveUri || '',
    manifestArweaveUri: '',
    mediaGatewayUrl: result.mediaGatewayUrl || '',
    manifestGatewayUrl: '',
    status: 'security-hold'
  });

  throw new Error(SECURITY_HOLD_REASON);
}

export function buildArweaveBundleFileName(/** @type {any} */ payload = {}) {
  return `${_slug(payload.title || payload.listingId || 'arweave-bundle')}.arweave-manifest.json`;
}
