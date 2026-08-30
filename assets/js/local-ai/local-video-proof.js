/** W625E/W625H — save, reopen, inspect and redacted-proof helpers for real local video. */
export const LOCAL_VIDEO_PROOF_SCHEMA = 'eon.local-ai.real-local-video-proof.w625e.v1';
const MAX_VIDEO_BYTES = 512 * 1024 * 1024;
const ACCEPTED_VIDEO_TYPES = Object.freeze(['video/mp4', 'video/webm', 'image/gif']);

function clean(value = '', max = 240) {
  const printable = Array.from(String(value || ''), (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? ' ' : character;
  }).join('');
  return printable.replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeFilename(value = '') {
  const name = clean(value || 'eonapp-local-video.webm', 180).replace(/[\\/:*?"<>|]+/g, '-').replace(/^\.+/, '');
  return name || 'eonapp-local-video.webm';
}

async function sha256Blob(blob) {
  const bytes = await blob.arrayBuffer();
  const digest = await globalThis.crypto?.subtle?.digest?.('SHA-256', bytes);
  if (!digest) throw new Error('sha256-unavailable');
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function inspectVideoElement(blob, urlRef = globalThis.URL, documentRef = globalThis.document) {
  return new Promise((resolve) => {
    if (!documentRef?.createElement || !urlRef?.createObjectURL) { resolve({ ok: false, error: 'video-metadata-unavailable' }); return; }
    const url = urlRef.createObjectURL(blob);
    const video = documentRef.createElement('video');
    const finish = (result) => {
      try { urlRef.revokeObjectURL(url); } catch {}
      try { video.removeAttribute?.('src'); video.load?.(); } catch {}
      resolve(result);
    };
    const timer = setTimeout(() => finish({ ok: false, error: 'video-metadata-timeout' }), 12000);
    video.preload = 'metadata';
    video.muted = true;
    video.onloadedmetadata = () => {
      clearTimeout(timer);
      finish({ ok: true, width: Number(video.videoWidth || 0), height: Number(video.videoHeight || 0), durationSeconds: Number(video.duration || 0) });
    };
    video.onerror = () => { clearTimeout(timer); finish({ ok: false, error: 'video-decode-failed' }); };
    video.src = url;
  });
}

export async function inspectLocalVideoBlob(blob, { filename = '', documentRef = globalThis.document, urlRef = globalThis.URL } = {}) {
  if (!(blob instanceof Blob) || !blob.size) return Object.freeze({ ok: false, error: 'video-empty', message: 'The local video file is empty.' });
  if (blob.size > MAX_VIDEO_BYTES) return Object.freeze({ ok: false, error: 'video-too-large', message: 'The video is larger than the reviewed EONAPP local proof limit.' });
  const type = clean(blob.type || '', 80).toLowerCase();
  const lowerName = clean(filename, 180).toLowerCase();
  const typeAllowed = ACCEPTED_VIDEO_TYPES.includes(type) || /\.(mp4|webm|gif)$/.test(lowerName) || type === 'application/octet-stream';
  if (!typeAllowed) return Object.freeze({ ok: false, error: 'video-type-not-approved', message: 'Use an MP4, WebM or GIF output from the reviewed local workflow.' });
  let sha256 = '';
  try { sha256 = await sha256Blob(blob); } catch { return Object.freeze({ ok: false, error: 'sha256-unavailable', message: 'This browser could not compute the output integrity digest.' }); }
  const metadata = type === 'image/gif' || /\.gif$/.test(lowerName)
    ? { ok: true, width: 0, height: 0, durationSeconds: 0, metadataLimited: true }
    : await inspectVideoElement(blob, urlRef, documentRef);
  return Object.freeze({
    ok: true,
    filename: safeFilename(filename),
    type: type || 'application/octet-stream',
    bytes: blob.size,
    sha256,
    width: Math.max(0, Number(metadata.width || 0)),
    height: Math.max(0, Number(metadata.height || 0)),
    durationSeconds: Math.max(0, Number(metadata.durationSeconds || 0)),
    metadataLoaded: metadata.ok === true,
    metadataError: metadata.ok ? '' : clean(metadata.error, 80),
    message: metadata.ok ? 'The video bytes and browser metadata were inspected locally.' : 'The video bytes are valid, but this browser could not decode metadata. Preserve the file and inspect it externally.'
  });
}

export async function validateLocalVideoInputFile(file) {
  if (!(file instanceof Blob) || !file.size) return Object.freeze({ ok: false, error: 'input-empty', message: 'Choose a non-empty PNG, JPEG or WebP first frame.' });
  const type = clean(file.type, 80).toLowerCase();
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(type)) return Object.freeze({ ok: false, error: 'input-type-not-approved', message: 'The first frame must be PNG, JPEG or WebP.' });
  if (file.size > 20 * 1024 * 1024) return Object.freeze({ ok: false, error: 'input-too-large', message: 'The first frame must be 20 MB or smaller.' });
  return Object.freeze({ ok: true, filename: safeFilename(file.name || 'eonapp-video-first-frame.png'), type, bytes: file.size, sha256: await sha256Blob(file) });
}

export async function saveLocalVideoBlob(blob, filename = 'eonapp-local-video.webm', { documentRef = globalThis.document, urlRef = globalThis.URL } = {}) {
  if (!(blob instanceof Blob) || !blob.size) return Object.freeze({ ok: false, error: 'video-empty', message: 'No generated local video is available to save.' });
  if (!documentRef?.createElement || !urlRef?.createObjectURL) return Object.freeze({ ok: false, error: 'save-unavailable', message: 'This browser cannot start the local file save.' });
  const url = urlRef.createObjectURL(blob);
  try {
    const anchor = documentRef.createElement('a');
    anchor.href = url;
    anchor.download = safeFilename(filename);
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    documentRef.body?.append?.(anchor);
    anchor.click?.();
    anchor.remove?.();
    return Object.freeze({ ok: true, bytes: blob.size, message: 'The browser save was started. Reopen the saved file to verify the same bytes.' });
  } finally {
    setTimeout(() => { try { urlRef.revokeObjectURL(url); } catch {} }, 0);
  }
}

export async function reopenLocalVideoFile(file, { expectedSha256 = '', documentRef = globalThis.document, urlRef = globalThis.URL } = {}) {
  const inspection = await inspectLocalVideoBlob(file, { filename: file?.name || '', documentRef, urlRef });
  if (!inspection.ok) return inspection;
  const digestMatched = Boolean(expectedSha256 && inspection.sha256 === expectedSha256);
  const objectUrl = urlRef?.createObjectURL ? urlRef.createObjectURL(file) : '';
  return Object.freeze({ ...inspection, objectUrl, verifiedReopen: digestMatched, message: digestMatched ? 'The reopened saved video matches the generated SHA-256 digest.' : 'The reopened file does not match the generated video digest.' });
}

export function buildLocalVideoProofReceipt(input = {}) {
  const negativeLanes = Object.fromEntries(Object.entries(input.negativeLanes || {}).map(([key, value]) => [clean(key, 80), clean(value || 'pending', 40)]));
  const happyPath = Boolean(input.promptSubmitted && input.promptIdRecorded && input.realProgressObserved && input.historyCompleted && input.outputFetched && input.outputPreviewed && input.outputSaved && input.outputReopened && input.digestMatched);
  const negativePass = Object.keys(negativeLanes).length >= 11 && Object.values(negativeLanes).every((value) => value === 'pass');
  return Object.freeze({
    schema: LOCAL_VIDEO_PROOF_SCHEMA,
    recordedAt: new Date().toISOString(),
    sourceRevisionOrZipSha256: clean(input.sourceRevisionOrZipSha256, 128),
    eonappOrigin: clean(input.eonappOrigin, 180),
    comfyEndpoint: clean(input.comfyEndpoint, 180),
    referenceDevice: Object.freeze({
      usableVramBytes: Math.max(0, Number(input.usableVramBytes || 0)),
      systemRamBytes: Math.max(0, Number(input.systemRamBytes || 0)),
      freeStorageBytes: Math.max(0, Number(input.freeStorageBytes || 0)),
      capabilityVerdict: clean(input.capabilityVerdict || 'unsupported', 40)
    }),
    ownerFourGbFallback: Object.freeze({
      capabilityVerdict: clean(input.ownerFourGbCapabilityVerdict || 'pending', 40),
      submissionBlocked: input.ownerFourGbSubmissionBlocked === true,
      modelDownloadStarted: false,
      cloudFallbackObserved: false
    }),
    workflow: Object.freeze({
      family: 'Wan2.2 TI2V 5B',
      mode: 'image-to-video',
      workflowId: clean(input.workflowId, 100),
      workflowVersion: clean(input.workflowVersion, 100),
      workflowSha256: clean(input.workflowSha256, 128),
      standardCoreNodesOnly: input.standardCoreNodesOnly === true,
      width: Math.max(0, Number(input.width || 0)),
      height: Math.max(0, Number(input.height || 0)),
      frames: Math.max(0, Number(input.frames || 0)),
      fps: Math.max(0, Number(input.fps || 0)),
      batch: 1,
      seedRecorded: input.seedRecorded === true
    }),
    job: Object.freeze({
      promptSubmitted: input.promptSubmitted === true,
      promptIdRecorded: input.promptIdRecorded === true,
      realProgressObserved: input.realProgressObserved === true,
      historyCompleted: input.historyCompleted === true,
      outputFetched: input.outputFetched === true,
      outputPreviewed: input.outputPreviewed === true,
      outputSaved: input.outputSaved === true,
      outputReopened: input.outputReopened === true,
      digestMatched: input.digestMatched === true
    }),
    output: Object.freeze({
      container: clean(input.container || '', 40),
      bytes: Math.max(0, Number(input.outputBytes || 0)),
      sha256: clean(input.outputSha256 || '', 128),
      durationSeconds: Math.max(0, Number(input.durationSeconds || 0)),
      width: Math.max(0, Number(input.outputWidth || 0)),
      height: Math.max(0, Number(input.outputHeight || 0)),
      playbackCompleted: input.playbackCompleted === true
    }),
    privacy: Object.freeze({
      cloudGenerationRequestsObserved: 0,
      providerKeysUsed: false,
      rawPromptInRedactedEvidence: false,
      referenceImageUploadedExternally: false,
      modelFilenamesIncluded: false,
      localPathsIncluded: false,
      mediaBodyIncluded: false
    }),
    negativeLanes: Object.freeze(negativeLanes),
    realVideoProofPass: happyPath && negativePass,
    verdict: happyPath && negativePass ? 'pass' : 'pending-or-fail',
    openBlockers: Object.freeze((input.openBlockers || []).map((row) => clean(row, 240)).filter(Boolean).slice(0, 24))
  });
}

export function downloadLocalVideoProofReceipt(receipt, { documentRef = globalThis.document, urlRef = globalThis.URL, filename = 'EONAPP_W625E_REAL_LOCAL_VIDEO_PROOF_RECEIPT.json' } = {}) {
  if (!documentRef?.createElement || !urlRef?.createObjectURL) return Object.freeze({ ok: false, error: 'download-unavailable' });
  const blob = new Blob([`${JSON.stringify(receipt, null, 2)}\n`], { type: 'application/json' });
  const url = urlRef.createObjectURL(blob);
  try {
    const anchor = documentRef.createElement('a');
    anchor.href = url;
    anchor.download = safeFilename(filename).replace(/\.(mp4|webm|gif)$/i, '.json');
    documentRef.body?.append?.(anchor);
    anchor.click?.();
    anchor.remove?.();
    return Object.freeze({ ok: true, bytes: blob.size });
  } finally { setTimeout(() => { try { urlRef.revokeObjectURL(url); } catch {} }, 0); }
}

export function getLocalVideoProofTruth() {
  return Object.freeze({
    schema: LOCAL_VIDEO_PROOF_SCHEMA,
    realProofCanBeAwardedBySource: false,
    realProofRequiresDigestMatchedSaveReopen: true,
    realProofRequiresElevenNegativeLanes: true,
    promptPersisted: false,
    mediaPersistedByEonapp: false,
    cloudFallback: false
  });
}
