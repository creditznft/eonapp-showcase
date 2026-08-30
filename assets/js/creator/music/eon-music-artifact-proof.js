/** Institutional AI V2 — browser-local save/reopen proof for Music artifacts. */

const freeze = Object.freeze;
export const EON_MUSIC_MAX_REOPEN_BYTES = 256 * 1024 * 1024;
const AUDIO_TYPES = freeze(new Set([
  'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4',
  'audio/aac', 'audio/ogg', 'audio/opus', 'audio/flac', 'audio/webm'
]));

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export async function sha256MusicBlob(blob) {
  if (!blob || typeof blob.arrayBuffer !== 'function') return '';
  const subtle = globalThis.crypto?.subtle;
  if (!subtle?.digest) return '';
  try {
    return bytesToHex(await subtle.digest('SHA-256', await blob.arrayBuffer()));
  } catch {
    return '';
  }
}

export function isReviewedMusicType(contentType = '', fileName = '') {
  const type = String(contentType || '').split(';')[0].trim().toLowerCase();
  if (AUDIO_TYPES.has(type)) return true;
  return /\.(?:wav|mp3|m4a|aac|ogg|oga|opus|flac|webm)$/i.test(String(fileName || '').trim());
}

export async function prepareMusicArtifactProof(blob, { contentType = '', fileName = '' } = {}) {
  const sizeBytes = Number(blob?.size || 0);
  if (!blob || typeof blob.arrayBuffer !== 'function' || sizeBytes < 1 || sizeBytes > EON_MUSIC_MAX_REOPEN_BYTES) {
    return freeze({ ok: false, reason: 'generated-audio-size-rejected', sha256: '', sizeBytes });
  }
  const type = String(contentType || blob.type || '').split(';')[0].trim().toLowerCase();
  if (!isReviewedMusicType(type, fileName)) return freeze({ ok: false, reason: 'generated-audio-type-rejected', sha256: '', sizeBytes });
  const sha256 = await sha256MusicBlob(blob);
  return freeze({ ok: Boolean(sha256), reason: sha256 ? 'generated-audio-digest-ready' : 'generated-audio-digest-unavailable', sha256, sizeBytes, contentType: type });
}

export async function verifyMusicArtifactReopen(file, { expectedSha256 = '', expectedBytes = 0 } = {}) {
  if (!file || typeof file.arrayBuffer !== 'function') return freeze({ ok: false, digestMatched: false, reason: 'reopen-audio-required' });
  const sizeBytes = Number(file.size || 0);
  if (!Number.isFinite(sizeBytes) || sizeBytes < 1 || sizeBytes > EON_MUSIC_MAX_REOPEN_BYTES) return freeze({ ok: false, digestMatched: false, reason: 'reopen-audio-size-rejected' });
  if (!isReviewedMusicType(file.type, file.name)) return freeze({ ok: false, digestMatched: false, reason: 'reopen-audio-type-rejected' });
  const expected = String(expectedSha256 || '').trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expected)) return freeze({ ok: false, digestMatched: false, reason: 'generated-audio-digest-required' });
  if (Number(expectedBytes || 0) > 0 && sizeBytes !== Number(expectedBytes)) return freeze({ ok: false, digestMatched: false, reason: 'reopen-audio-size-mismatch', sizeBytes });
  const sha256 = await sha256MusicBlob(file);
  if (!sha256) return freeze({ ok: false, digestMatched: false, reason: 'reopen-audio-digest-unavailable' });
  const digestMatched = sha256 === expected;
  return freeze({ ok: digestMatched, digestMatched, reason: digestMatched ? 'save-reopen-audio-digest-matched' : 'reopen-audio-digest-mismatch', sha256, sizeBytes, contentType: String(file.type || '').split(';')[0].trim().toLowerCase() });
}

export function canRecordMusicOutcome(artifact = null) {
  return Boolean(artifact?.saved === true && artifact?.digestMatched === true && /^[a-f0-9]{64}$/i.test(String(artifact?.sha256 || '')));
}

export function getEonMusicArtifactProofTruth() {
  return freeze({
    proofRunsInBrowser: true,
    generatedDigestRequired: true,
    explicitSaveRequired: true,
    explicitReopenRequired: true,
    byteForByteDigestMatchRequired: true,
    decodedPlaybackClaimed: false,
    promptStoredInProof: false,
    credentialStoredInProof: false,
    audioUploadedForProof: false,
    maxReopenBytes: EON_MUSIC_MAX_REOPEN_BYTES
  });
}
