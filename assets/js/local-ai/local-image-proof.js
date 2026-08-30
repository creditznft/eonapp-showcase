/**
 * W625A — local image save/reopen and redacted proof helpers.
 *
 * Image bytes remain in page memory or in a user-selected local file. No image,
 * prompt, checkpoint filename, filesystem path, provider key or media body is
 * written to localStorage or sent to an EONAPP server.
 */

export const LOCAL_IMAGE_PROOF_SCHEMA = 'eonapp.local-ai.real-image-proof.w625a.v1';
const MAX_IMAGE_BYTES = 80 * 1024 * 1024;

function cleanText(value = '', max = 220) {
  return Array.from(String(value || ''), (character) => {
    const code = character.codePointAt(0) || 0;
    return code >= 32 && code !== 127 ? character : ' ';
  }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeFilename(value = '') {
  const name = cleanText(value || 'eonapp-local-image.png', 180).replace(/[\\/:*?"<>|]+/g, '_');
  return /\.(?:png|jpe?g|webp)$/i.test(name) ? name : `${name || 'eonapp-local-image'}.png`;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256LocalImageBlob(blob, { cryptoRef = globalThis.crypto } = {}) {
  if (!(blob instanceof Blob)) throw new Error('image-blob-required');
  if (!cryptoRef?.subtle?.digest) throw new Error('sha256-unavailable');
  const digest = await cryptoRef.subtle.digest('SHA-256', await blob.arrayBuffer());
  return bytesToHex(new Uint8Array(digest));
}

export async function inspectLocalImageBlob(blob, {
  filename = 'eonapp-local-image.png',
  createImageBitmapRef = globalThis.createImageBitmap,
  cryptoRef = globalThis.crypto
} = {}) {
  if (!(blob instanceof Blob)) return Object.freeze({ ok: false, error: 'image-blob-required', message: 'Choose a local image file.' });
  const bytes = Number(blob.size || 0);
  const type = cleanText(blob.type || '', 80).toLowerCase();
  if (!bytes) return Object.freeze({ ok: false, error: 'image-empty', message: 'The selected image file is empty.' });
  if (bytes > MAX_IMAGE_BYTES) return Object.freeze({ ok: false, error: 'image-too-large', message: 'The selected image is too large for this local proof lane.' });
  if (!type.startsWith('image/')) return Object.freeze({ ok: false, error: 'image-type-required', message: 'Choose a PNG, JPEG or WebP image.' });
  let width = 0;
  let height = 0;
  if (typeof createImageBitmapRef === 'function') {
    try {
      const bitmap = await createImageBitmapRef(blob);
      width = Math.max(0, Number(bitmap?.width || 0) || 0);
      height = Math.max(0, Number(bitmap?.height || 0) || 0);
      try { bitmap?.close?.(); } catch {}
    } catch {
      return Object.freeze({ ok: false, error: 'image-decode-failed', message: 'The selected file could not be decoded as an image.' });
    }
  }
  let sha256 = '';
  try { sha256 = await sha256LocalImageBlob(blob, { cryptoRef }); } catch {}
  return Object.freeze({
    ok: true,
    schema: 'eonapp.local-ai.local-image-file-inspection.w625a.v1',
    filename: safeFilename(filename),
    type,
    bytes,
    width,
    height,
    sha256,
    message: width && height ? `Local image ready: ${width}×${height}.` : 'Local image bytes are ready.'
  });
}

export async function saveLocalImageBlob(blob, filename = 'eonapp-local-image.png', {
  showSaveFilePickerRef = globalThis.showSaveFilePicker,
  documentRef = globalThis.document,
  urlRef = globalThis.URL
} = {}) {
  if (!(blob instanceof Blob) || !blob.size) return Object.freeze({ ok: false, error: 'image-blob-required', verified: false, message: 'Generate or reopen an image before saving.' });
  const suggestedName = safeFilename(filename);
  if (typeof showSaveFilePickerRef === 'function') {
    try {
      const handle = await showSaveFilePickerRef({
        suggestedName,
        types: [{ description: 'Image file', accept: { [blob.type || 'image/png']: ['.png', '.jpg', '.jpeg', '.webp'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return Object.freeze({ ok: true, mode: 'file-system-access', filename: cleanText(handle?.name || suggestedName, 180), bytes: blob.size, verified: true, message: 'Image saved to the location you selected.' });
    } catch (error) {
      if (String(error?.name || '') === 'AbortError') return Object.freeze({ ok: false, error: 'save-cancelled', verified: false, message: 'Save was cancelled.' });
      return Object.freeze({ ok: false, error: 'save-failed', verified: false, message: 'The browser could not write the selected local file.' });
    }
  }
  if (!documentRef?.createElement || !urlRef?.createObjectURL) return Object.freeze({ ok: false, error: 'download-unavailable', verified: false, message: 'This browser cannot start a local download.' });
  const url = urlRef.createObjectURL(blob);
  try {
    const anchor = documentRef.createElement('a');
    anchor.href = url;
    anchor.download = suggestedName;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    documentRef.body?.append?.(anchor);
    anchor.click?.();
    anchor.remove?.();
    return Object.freeze({ ok: true, mode: 'browser-download', filename: suggestedName, bytes: blob.size, verified: false, message: 'Download started. Reopen the saved file in EONAPP to verify it.' });
  } finally {
    setTimeout(() => { try { urlRef.revokeObjectURL(url); } catch {} }, 0);
  }
}

export async function reopenLocalImageFile(file, {
  expectedSha256 = '',
  createImageBitmapRef = globalThis.createImageBitmap,
  cryptoRef = globalThis.crypto,
  urlRef = globalThis.URL
} = {}) {
  const inspected = await inspectLocalImageBlob(file, { filename: file?.name || 'reopened-image.png', createImageBitmapRef, cryptoRef });
  if (!inspected.ok) return inspected;
  const expected = cleanText(expectedSha256, 80).toLowerCase();
  const matchesGenerated = Boolean(expected && inspected.sha256 && expected === inspected.sha256.toLowerCase());
  const objectUrl = urlRef?.createObjectURL ? urlRef.createObjectURL(file) : '';
  return Object.freeze({
    ...inspected,
    objectUrl,
    matchesGenerated,
    verifiedReopen: matchesGenerated,
    message: expected
      ? matchesGenerated
        ? 'The reopened file matches the generated image exactly.'
        : 'The reopened file does not match the generated image.'
      : 'The local image was reopened, but there is no generated digest to compare.'
  });
}

export function buildLocalImageProofReceipt(input = {}) {
  const negativeLanes = input.negativeLanes && typeof input.negativeLanes === 'object' ? input.negativeLanes : {};
  const generated = input.generated === true;
  const fetched = input.fetched === true;
  const previewed = input.previewed === true;
  const saveInitiated = input.saveInitiated === true;
  const reopened = input.reopened === true;
  const digestMatched = input.digestMatched === true;
  const positivePathComplete = generated && fetched && previewed && saveInitiated && reopened && digestMatched;
  return Object.freeze({
    schema: LOCAL_IMAGE_PROOF_SCHEMA,
    recordedAt: new Date(Number(input.now || Date.now())).toISOString(),
    sourceRevisionOrZipSha256: cleanText(input.sourceRevisionOrZipSha256, 80),
    eonappOrigin: cleanText(input.eonappOrigin, 160),
    comfyEndpoint: cleanText(input.comfyEndpoint, 160),
    runtimeReached: input.runtimeReached === true,
    checkpointCount: Math.max(0, Number(input.checkpointCount || 0) || 0),
    checkpointFamily: cleanText(input.checkpointFamily || 'unknown', 40),
    workflow: Object.freeze({
      id: cleanText(input.workflowId, 120),
      profileId: cleanText(input.profileId, 80),
      width: Math.max(0, Number(input.width || 0) || 0),
      height: Math.max(0, Number(input.height || 0) || 0),
      steps: Math.max(0, Number(input.steps || 0) || 0),
      batch: 1,
      standardNodesOnly: input.standardNodesOnly === true
    }),
    promptSubmitted: generated,
    historyCompleted: input.historyCompleted === true,
    outputFetched: fetched,
    outputVisibleInEonapp: previewed,
    saveInitiated,
    savedOutputReopened: reopened,
    reopenedDigestMatchedGenerated: digestMatched,
    outputSha256: cleanText(input.outputSha256, 80),
    savedOutputBytes: Math.max(0, Number(input.savedOutputBytes || 0) || 0),
    savedOutputWidth: Math.max(0, Number(input.savedOutputWidth || 0) || 0),
    savedOutputHeight: Math.max(0, Number(input.savedOutputHeight || 0) || 0),
    cloudRequestsObserved: Math.max(0, Number(input.cloudRequestsObserved || 0) || 0),
    providerKeysUsed: false,
    videoAttempted: false,
    cancellationAttempted: input.cancellationAttempted === true,
    negativeLanes: Object.freeze({
      runtimeStopped: cleanText(negativeLanes.runtimeStopped || 'pending', 40),
      noCheckpoint: cleanText(negativeLanes.noCheckpoint || 'pending', 40),
      unapprovedEndpoint: cleanText(negativeLanes.unapprovedEndpoint || 'pending', 40),
      corsDeniedAndRecovered: cleanText(negativeLanes.corsDeniedAndRecovered || 'pending', 40),
      timeoutRecovered: cleanText(negativeLanes.timeoutRecovered || 'pending', 40),
      cancellationRecovered: cleanText(negativeLanes.cancellationRecovered || 'pending', 40),
      restartRetry: cleanText(negativeLanes.restartRetry || 'pending', 40),
      resetRefreshTruth: cleanText(negativeLanes.resetRefreshTruth || 'pending', 40)
    }),
    positivePathComplete,
    realImageProofPass: positivePathComplete && Object.values(negativeLanes).length >= 7 && Object.values(negativeLanes).every((value) => value === 'pass'),
    promptIncluded: false,
    checkpointFilenameIncluded: false,
    localPathIncluded: false,
    mediaBodyIncluded: false,
    verdict: positivePathComplete ? 'positive-path-complete-negative-lanes-pending-or-reviewed' : 'pending',
    openBlockers: Object.freeze((Array.isArray(input.openBlockers) ? input.openBlockers : []).map((item) => cleanText(item, 240)).filter(Boolean).slice(0, 24))
  });
}

export function downloadLocalImageProofReceipt(receipt, {
  documentRef = globalThis.document,
  urlRef = globalThis.URL,
  filename = 'EONAPP_W625A_REAL_LOCAL_IMAGE_PROOF_RECEIPT.json'
} = {}) {
  if (!documentRef?.createElement || !urlRef?.createObjectURL) return Object.freeze({ ok: false, error: 'download-unavailable' });
  const blob = new Blob([`${JSON.stringify(receipt, null, 2)}\n`], { type: 'application/json' });
  const url = urlRef.createObjectURL(blob);
  try {
    const anchor = documentRef.createElement('a');
    anchor.href = url;
    anchor.download = safeFilename(filename).replace(/\.png$/i, '.json');
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    documentRef.body?.append?.(anchor);
    anchor.click?.();
    anchor.remove?.();
    return Object.freeze({ ok: true, bytes: blob.size });
  } finally {
    setTimeout(() => { try { urlRef.revokeObjectURL(url); } catch {} }, 0);
  }
}

export function getLocalImageProofTruth() {
  return Object.freeze({
    schema: LOCAL_IMAGE_PROOF_SCHEMA,
    imageBytesPersistedByEonapp: false,
    promptPersisted: false,
    checkpointFilenameInReceipt: false,
    localPathInReceipt: false,
    saveRequiresUserAction: true,
    reopenRequiresUserFileChoice: true,
    digestMatchRequiredForVerifiedReopen: true,
    realProofCanBeAwardedBySource: false,
    cloudFallback: false,
    videoEnabled: false
  });
}
