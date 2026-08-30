/** Institutional AI v2 — browser-local proof for hosted Image/Video save + reopen parity. */

const freeze = Object.freeze;
export const EON_DIRECT_MEDIA_MAX_REOPEN_BYTES = 160 * 1024 * 1024;

const MIME_BY_KIND = freeze({
  image: freeze(new Set(['image/png', 'image/jpeg', 'image/webp'])),
  video: freeze(new Set(['video/mp4', 'video/webm']))
});

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export async function sha256MediaBlob(blob) {
  if (!blob || typeof blob.arrayBuffer !== 'function') return '';
  const subtle = globalThis.crypto?.subtle;
  if (!subtle?.digest) return '';
  try {
    const digest = await subtle.digest('SHA-256', await blob.arrayBuffer());
    return bytesToHex(digest);
  } catch {
    return '';
  }
}

export function isReviewedHostedMediaType(mediaKind = '', contentType = '') {
  const allowed = MIME_BY_KIND[String(mediaKind || '')];
  return Boolean(allowed?.has(String(contentType || '').split(';')[0].trim().toLowerCase()));
}

export async function verifyHostedMediaReopen(file, { mediaKind = '', expectedSha256 = '', expectedBytes = 0 } = {}) {
  if (!file || typeof file.arrayBuffer !== 'function') return freeze({ ok: false, verifiedReopen: false, reason: 'reopen-file-required' });
  const size = Number(file.size || 0);
  if (!Number.isFinite(size) || size < 1 || size > EON_DIRECT_MEDIA_MAX_REOPEN_BYTES) return freeze({ ok: false, verifiedReopen: false, reason: 'reopen-size-rejected' });
  if (!isReviewedHostedMediaType(mediaKind, file.type)) return freeze({ ok: false, verifiedReopen: false, reason: 'reopen-media-type-rejected' });
  const expected = String(expectedSha256 || '').trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expected)) return freeze({ ok: false, verifiedReopen: false, reason: 'generated-digest-required' });
  if (Number(expectedBytes || 0) > 0 && size !== Number(expectedBytes)) return freeze({ ok: false, verifiedReopen: false, reason: 'reopen-size-mismatch', sizeBytes: size });
  const sha256 = await sha256MediaBlob(file);
  if (!sha256) return freeze({ ok: false, verifiedReopen: false, reason: 'reopen-digest-unavailable' });
  const verifiedReopen = sha256 === expected;
  return freeze({
    ok: verifiedReopen,
    verifiedReopen,
    reason: verifiedReopen ? 'save-reopen-digest-matched' : 'reopen-digest-mismatch',
    sha256,
    sizeBytes: size,
    contentType: String(file.type || '').split(';')[0].trim().toLowerCase()
  });
}

export function canRecordHostedMediaOutcome({ mediaKind = '', artifact = null } = {}) {
  if (!artifact || artifact.saved !== true || artifact.digestMatched !== true || !artifact.sha256) return false;
  if (mediaKind === 'image') return true;
  if (mediaKind === 'video') return artifact.playbackCompleted === true;
  return false;
}

export function getDirectMediaProofTruth() {
  return freeze({
    proofRunsInBrowser: true,
    generatedDigestRequired: true,
    explicitSaveRequired: true,
    explicitReopenRequired: true,
    byteForByteDigestMatchRequired: true,
    hostedVideoPlaybackCompletionRequired: true,
    promptStoredInProof: false,
    credentialStoredInProof: false,
    mediaUploadedForProof: false,
    cloudReceiptRequired: false,
    maxReopenBytes: EON_DIRECT_MEDIA_MAX_REOPEN_BYTES
  });
}
