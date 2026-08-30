/** W403 — lean creator-media lifecycle model. No blobs or media bodies persist here. */

export const CREATOR_MEDIA_LIFECYCLE_SCHEMA = 'eonapp.creator.media-lifecycle.v1';
export const CREATOR_MEDIA_ROLES = Object.freeze([
  Object.freeze({ id: 'source', label: 'Source input', retention: 'page-memory-until-task-close', keep: false, note: 'Original uploads or permitted source selections are temporary task inputs.' }),
  Object.freeze({ id: 'proxy', label: 'Preview proxy', retention: 'page-memory-until-preview-close', keep: false, note: 'Low-resolution previews are temporary and should be released when the preview closes.' }),
  Object.freeze({ id: 'render-cache', label: 'Render cache', retention: 'job-temporary', keep: false, note: 'Intermediate render/cache material is disposable after a result is reviewed or a job ends.' }),
  Object.freeze({ id: 'final-output', label: 'Final output', retention: 'explicit-user-save-required', keep: true, note: 'Keep only a final output the user explicitly saves to their chosen device or storage location.' }),
  Object.freeze({ id: 'export-receipt', label: 'Export receipt', retention: 'page-memory-until-export', keep: false, note: 'A small metadata receipt may be exported by the user; it never includes the media body.' })
]);

const SECRET_LIKE = /(?:sk-[a-z0-9_-]{12,}|api[_ -]?key\s*[:=]|bearer\s+[a-z0-9._-]{12,}|-----begin(?: [a-z]+)? private key-----|seed phrase|mnemonic)/i;

function cleanText(value = '', max = 220) {
  const safe = Array.from(String(value || ''), (character) => {
    const code = character.codePointAt(0) || 0;
    return code >= 32 && code !== 127 ? character : ' ';
  }).join('');
  return safe.replace(/\s+/g, ' ').trim().slice(0, max);
}

function findRole(id = '') {
  return CREATOR_MEDIA_ROLES.find((item) => item.id === String(id || '').trim()) || CREATOR_MEDIA_ROLES[0];
}

function makeId() {
  try { return `media-${crypto.randomUUID()}`; } catch { return `media-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`; }
}

export function createCreatorMediaLifecycleEntry(input = {}) {
  const title = cleanText(input.title, 180);
  const role = findRole(input.role);
  const format = cleanText(input.format, 80);
  const note = cleanText(input.note, 600);
  if (!title) throw new Error('Add a short media work name before creating a lifecycle entry.');
  if (SECRET_LIKE.test(`${title}\n${format}\n${note}`)) throw new Error('Do not put a key, password, recovery phrase, or other secret into a media lifecycle entry.');
  if (Object.prototype.hasOwnProperty.call(input, 'file') || Object.prototype.hasOwnProperty.call(input, 'blob') || Object.prototype.hasOwnProperty.call(input, 'dataUrl') || Object.prototype.hasOwnProperty.call(input, 'bytes')) {
    throw new Error('A lifecycle entry stores metadata only. It never accepts a file, Blob, data URL, or media body.');
  }
  return Object.freeze({
    schema: CREATOR_MEDIA_LIFECYCLE_SCHEMA,
    id: makeId(),
    title,
    role: role.id,
    roleLabel: role.label,
    retention: role.retention,
    keep: role.keep,
    format,
    note,
    createdAt: new Date().toISOString(),
    storage: 'current-page-memory-only',
    mediaBodyStored: false,
    automaticCloudBackup: false,
    externalDeletionClaim: false,
    userSaveRequired: role.id === 'final-output'
  });
}

export function buildCreatorMediaLifecycleExport(entries = []) {
  const rows = Array.isArray(entries) ? entries.slice(0, 100) : [];
  return Object.freeze({
    schema: `${CREATOR_MEDIA_LIFECYCLE_SCHEMA}.export`,
    exportedAt: new Date().toISOString(),
    entries: rows,
    retentionRules: CREATOR_MEDIA_ROLES,
    limitations: Object.freeze([
      'This is a local metadata plan, not a file backup, storage deletion proof, or cloud lifecycle policy.',
      'Source inputs, preview proxies, and render caches are designed to be temporary. The app should keep a final media file only when the user explicitly saves it.',
      'No original footage, render cache, video, image, audio file, provider credential, or private prompt is embedded in this export.'
    ])
  });
}

export function getCreatorMediaLifecycleTruth() {
  return Object.freeze({
    currentPageMemory: true,
    mediaBodyStored: false,
    localStorage: false,
    indexedDb: false,
    automaticCloudBackup: false,
    automaticDownload: false,
    finalOutputRequiresExplicitUserSave: true,
    remoteDeletionProof: false
  });
}
