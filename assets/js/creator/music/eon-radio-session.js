/** Institutional AI V2 — session-only personal radio queue.
 *
 * Keeps user-authorized audio and EON-generated audio in memory only. It never
 * uploads, publishes, scans a commercial catalogue, or persists File/Blob
 * contents. Object URLs are revoked when items leave the queue.
 */
export const EON_RADIO_SESSION_SCHEMA = 'eonapp.creator.radio-session.v1';
export const EON_RADIO_SESSION_MAX_ITEMS = 50;
export const EON_RADIO_SESSION_MAX_ITEM_BYTES = 256 * 1024 * 1024;
export const EON_RADIO_SESSION_MAX_TOTAL_BYTES = 768 * 1024 * 1024;

const AUDIO_EXTENSION_RE = /\.(?:wav|mp3|m4a|aac|ogg|oga|opus|flac|webm)$/i;
const freeze = (value) => Object.freeze(value);
// Sanitization deliberately strips C0 controls from browser-local media labels.
// eslint-disable-next-line no-control-regex
const clean = (value = '', max = 180) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function isAudioLike(file = {}) {
  const type = clean(file?.type, 120).toLowerCase();
  const name = clean(file?.name, 220);
  return type.startsWith('audio/') || AUDIO_EXTENSION_RE.test(name);
}

function resolveUrlApi(urlApi = globalThis.URL) {
  return urlApi && typeof urlApi.createObjectURL === 'function' && typeof urlApi.revokeObjectURL === 'function' ? urlApi : null;
}

function createId(prefix = 'radio') {
  try { return `${prefix}-${globalThis.crypto?.randomUUID?.() || Date.now()}`; }
  catch { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
}

export function createEonRadioSession(options = {}) {
  const items = [];
  let currentIndex = -1;
  const defaultUrlApi = resolveUrlApi(options.urlApi);

  const totalBytes = () => items.reduce((sum, item) => sum + finite(item.size), 0);
  const publicItem = (item, index) => freeze({
    id: item.id,
    name: item.name,
    type: item.type,
    size: item.size,
    source: item.source,
    objectUrl: item.objectUrl,
    current: index === currentIndex,
    userAuthorized: true,
    persistent: false
  });
  const snapshot = () => freeze({
    schema: EON_RADIO_SESSION_SCHEMA,
    itemCount: items.length,
    currentIndex,
    totalBytes: totalBytes(),
    items: freeze(items.map(publicItem)),
    userAuthorizedAudioOnly: true,
    commercialCatalogueAccess: false,
    uploaded: false,
    persisted: false
  });

  const addMedia = (media, { explicitUserAction = false, source = 'user-authorized', name = '', type = '', urlApi = defaultUrlApi } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
    const api = resolveUrlApi(urlApi);
    if (!api) return freeze({ ok: false, reason: 'object-url-api-unavailable', snapshot: snapshot() });
    if (!media || typeof media !== 'object') return freeze({ ok: false, reason: 'audio-file-required', snapshot: snapshot() });
    const size = Math.max(0, finite(media.size));
    const mediaName = clean(name || media.name || 'EON audio', 220);
    const mediaType = clean(type || media.type || 'audio/wav', 120).toLowerCase();
    if (!isAudioLike({ name: mediaName, type: mediaType })) return freeze({ ok: false, reason: 'audio-file-required', snapshot: snapshot() });
    if (size <= 0 || size > EON_RADIO_SESSION_MAX_ITEM_BYTES) return freeze({ ok: false, reason: 'audio-file-size-out-of-range', snapshot: snapshot() });
    if (items.length >= EON_RADIO_SESSION_MAX_ITEMS) return freeze({ ok: false, reason: 'radio-session-item-limit', snapshot: snapshot() });
    if (totalBytes() + size > EON_RADIO_SESSION_MAX_TOTAL_BYTES) return freeze({ ok: false, reason: 'radio-session-memory-budget', snapshot: snapshot() });
    const objectUrl = api.createObjectURL(media);
    const item = {
      id: createId('radio-track'),
      name: mediaName,
      type: mediaType,
      size,
      source: clean(source, 80) || 'user-authorized',
      objectUrl,
      media,
      urlApi: api
    };
    items.push(item);
    if (currentIndex < 0) currentIndex = 0;
    return freeze({ ok: true, reason: 'radio-session-track-added', item: publicItem(item, items.length - 1), snapshot: snapshot() });
  };

  const addFiles = (files = [], options = {}) => {
    if (options.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', added: freeze([]), rejected: freeze([]), snapshot: snapshot() });
    const rows = Array.from(files || []);
    const added = [];
    const rejected = [];
    for (const file of rows) {
      const result = addMedia(file, { ...options, explicitUserAction: true, source: 'user-authorized' });
      if (result.ok) added.push(result.item); else rejected.push(freeze({ name: clean(file?.name || 'audio', 220), reason: result.reason }));
    }
    return freeze({ ok: added.length > 0, reason: added.length ? 'radio-session-files-added' : (rejected[0]?.reason || 'audio-file-required'), added: freeze(added), rejected: freeze(rejected), snapshot: snapshot() });
  };

  const addGeneratedBlob = (blob, metadata = {}, options = {}) => addMedia(blob, {
    ...options,
    explicitUserAction: options.explicitUserAction === true,
    source: 'eon-generated',
    name: clean(metadata.name || metadata.fileName || 'EON generated track.wav', 220),
    type: clean(metadata.type || blob?.type || 'audio/wav', 120)
  });

  const setCurrent = (index) => {
    const next = Math.floor(finite(index, -1));
    if (next < 0 || next >= items.length) return freeze({ ok: false, reason: 'radio-track-not-found', snapshot: snapshot() });
    currentIndex = next;
    return freeze({ ok: true, reason: 'radio-track-selected', current: publicItem(items[currentIndex], currentIndex), snapshot: snapshot() });
  };
  const step = (direction = 1) => {
    if (!items.length) return freeze({ ok: false, reason: 'radio-session-empty', snapshot: snapshot() });
    currentIndex = (Math.max(0, currentIndex) + (direction >= 0 ? 1 : -1) + items.length) % items.length;
    return freeze({ ok: true, reason: direction >= 0 ? 'radio-next-track' : 'radio-previous-track', current: publicItem(items[currentIndex], currentIndex), snapshot: snapshot() });
  };
  const remove = (id = '', { explicitUserAction = false } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
    const index = items.findIndex((item) => item.id === String(id || ''));
    if (index < 0) return freeze({ ok: false, reason: 'radio-track-not-found', snapshot: snapshot() });
    const [item] = items.splice(index, 1);
    try { item.urlApi.revokeObjectURL(item.objectUrl); } catch {}
    if (!items.length) currentIndex = -1;
    else if (currentIndex > index) currentIndex -= 1;
    else if (currentIndex >= items.length) currentIndex = items.length - 1;
    return freeze({ ok: true, reason: 'radio-track-removed', snapshot: snapshot() });
  };
  const clear = ({ explicitUserAction = false } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
    for (const item of items.splice(0)) { try { item.urlApi.revokeObjectURL(item.objectUrl); } catch {} }
    currentIndex = -1;
    return freeze({ ok: true, reason: 'radio-session-cleared', snapshot: snapshot() });
  };
  const getCurrentMedia = () => {
    const item = items[currentIndex];
    return item ? freeze({ id: item.id, name: item.name, type: item.type, source: item.source, media: item.media, objectUrl: item.objectUrl }) : null;
  };

  return freeze({
    schema: EON_RADIO_SESSION_SCHEMA,
    addFiles,
    addGeneratedBlob,
    setCurrent,
    next: () => step(1),
    previous: () => step(-1),
    remove,
    clear,
    snapshot,
    getCurrentMedia
  });
}

export const eonRadioSession = createEonRadioSession();

export function getEonRadioSessionTruth() {
  return freeze({
    schema: EON_RADIO_SESSION_SCHEMA,
    sessionOnly: true,
    userAuthorizedAudioOnly: true,
    eonGeneratedAudioAllowed: true,
    commercialCatalogueAccess: false,
    upload: false,
    backgroundStreaming: false,
    persistentMediaStorage: false,
    explicitAddAndClearActions: true
  });
}

export default eonRadioSession;
