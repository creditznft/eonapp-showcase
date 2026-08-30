/**
 * W479-M6 contract implementation: safe metadata-only creator handoff.
 * The result tells a future Creator Library how a proved local output can be
 * saved and manually shared. It cannot upload or publish a media file.
 */
import {
  W479M_CREATOR_DISTRIBUTION_SCHEMA,
  W479M_SUPPORTED_ASSET_KINDS,
  W479M_BLOCKED_MEDIA_BODY_FIELDS,
  W479M_REQUIRED_ADAPTER_PROOFS,
  findW479MPlatformHandoff,
  getW479MCreatorDistributionTruth
} from '../../../config/w479m-creator-distribution-contract.mjs';

const SECRET_LIKE = /(?:sk-[a-z0-9_-]{12,}|api[_ -]?key\s*[:=]|bearer\s+[a-z0-9._-]{12,}|-----begin(?: [a-z]+)? private key-----|seed phrase|mnemonic)/i;

function cleanText(value = '', max = 420) {
  return Array.from(String(value || ''), (character) => {
    const code = character.codePointAt(0) || 0;
    return code >= 32 && code !== 127 ? character : ' ';
  }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
}

function makeId() {
  try { return `distribution-${crypto.randomUUID()}`; } catch { return `distribution-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`; }
}

function requireProofs(proofs = []) {
  const received = new Set(Array.isArray(proofs) ? proofs.map((item) => String(item || '').trim()) : []);
  const missing = W479M_REQUIRED_ADAPTER_PROOFS.filter((proof) => !received.has(proof));
  if (missing.length) throw new Error(`A local media adapter must prove: ${missing.join(', ')}.`);
  return W479M_REQUIRED_ADAPTER_PROOFS.slice();
}

function assertMetadataOnly(asset = {}) {
  if (!asset || typeof asset !== 'object') throw new Error('A future finished local asset metadata record is required.');
  for (const field of W479M_BLOCKED_MEDIA_BODY_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(asset, field)) throw new Error(`Creator distribution handoff accepts metadata only; remove ${field}.`);
  }
  const combined = JSON.stringify(asset);
  if (SECRET_LIKE.test(combined)) throw new Error('Do not put a credential, recovery phrase or other secret into a creator distribution handoff.');
}

export function createCreatorDistributionHandoff(input = {}) {
  const asset = input.asset || {};
  assertMetadataOnly(asset);
  const platform = findW479MPlatformHandoff(input.platformId);
  if (!platform) throw new Error('Choose a supported creator platform handoff.');
  const assetId = cleanText(asset.id || asset.assetId, 160);
  const title = cleanText(asset.title, 180);
  const kind = cleanText(asset.kind, 24).toLowerCase();
  const format = cleanText(asset.format, 80);
  const localPathHint = cleanText(asset.localPathHint, 240);
  if (!assetId || !title) throw new Error('The finished local asset needs an id and a short title.');
  if (!W479M_SUPPORTED_ASSET_KINDS.includes(kind)) throw new Error('Creator distribution accepts only a proved local image or video output.');
  if (!localPathHint) throw new Error('Keep a user-controlled local save/location hint before preparing a share handoff.');
  const adapterProofs = requireProofs(asset.adapterProofs);
  const caption = cleanText(input.caption, 2200);
  const altText = cleanText(input.altText, 500);
  const notes = cleanText(input.notes, 600);
  if (SECRET_LIKE.test(`${caption}\n${altText}\n${notes}`)) throw new Error('Do not put a credential, recovery phrase or other secret into captions or handoff notes.');
  return Object.freeze({
    schema: W479M_CREATOR_DISTRIBUTION_SCHEMA,
    id: makeId(),
    createdAt: new Date().toISOString(),
    asset: Object.freeze({ id: assetId, title, kind, format, localPathHint, adapterProofs: Object.freeze(adapterProofs), mediaBodyIncluded: false }),
    platform: Object.freeze({ id: platform.id, label: platform.label, availableNow: platform.now, laterRequirement: platform.later }),
    postDraft: Object.freeze({ caption, altText, notes }),
    state: 'prepared-for-user-review',
    userActionsRequired: Object.freeze([
      'review-the-local-output',
      'save-or-export-the-file-to-a-user-controlled-location',
      'review-caption-and-platform-rules',
      'choose-a-manual-share-or-a-future-approved-connector'
    ]),
    manualExportRequired: true,
    perPostReviewRequired: true,
    directPublishingCreated: false,
    accountConnectionCreated: false,
    tokenStored: false,
    backgroundUploadCreated: false,
    scheduledPostCreated: false,
    remotePostCreated: false,
    noSilentCloudFallback: true
  });
}

export function getCreatorDistributionHandoffTruth() {
  return getW479MCreatorDistributionTruth();
}
