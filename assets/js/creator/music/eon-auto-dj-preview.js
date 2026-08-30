/**
 * Institutional AI V2 — local Auto DJ crossfade preview.
 *
 * This is deliberately narrower than a rendered DJ mix. It crossfades
 * user-authorized/EON-generated audio in the browser, keeps media in memory,
 * and never uploads or persists File/Blob bodies. There is no tempo stretch,
 * beat-grid analysis, stem separation, key lock, or exported mix claim here.
 */
export const EON_AUTO_DJ_PREVIEW_SCHEMA = 'eonapp.creator.auto-dj-preview.v1';
export const EON_AUTO_DJ_PREVIEW_MAX_ITEMS = 24;
export const EON_AUTO_DJ_PREVIEW_MAX_ITEM_BYTES = 256 * 1024 * 1024;
export const EON_AUTO_DJ_PREVIEW_MAX_TOTAL_BYTES = 1024 * 1024 * 1024;

const AUDIO_EXTENSION_RE = /\.(?:wav|mp3|m4a|aac|ogg|oga|opus|flac|webm)$/i;
const freeze = (value) => Object.freeze(value);
// Sanitization deliberately strips C0 controls from browser-local labels.
// eslint-disable-next-line no-control-regex
const clean = (value = '', max = 220) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function resolveUrlApi(value = globalThis.URL) {
  return value && typeof value.createObjectURL === 'function' && typeof value.revokeObjectURL === 'function' ? value : null;
}
function isAudioLike(file = {}) {
  const type = clean(file?.type, 120).toLowerCase();
  return type.startsWith('audio/') || AUDIO_EXTENSION_RE.test(clean(file?.name, 220));
}
function makeId() {
  try { return `dj-track-${globalThis.crypto?.randomUUID?.() || Date.now()}`; }
  catch { return `dj-track-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
}
function defaultAudioFactory(src) {
  if (typeof Audio !== 'function') return null;
  const audio = new Audio(src);
  audio.preload = 'metadata';
  audio.crossOrigin = 'anonymous';
  return audio;
}

export function createEonAutoDjPreviewSession(options = {}) {
  const items = [];
  const urlApi = resolveUrlApi(options.urlApi);
  const audioFactory = typeof options.audioFactory === 'function' ? options.audioFactory : defaultAudioFactory;
  const raf = typeof options.requestAnimationFrame === 'function' ? options.requestAnimationFrame : (typeof globalThis.requestAnimationFrame === 'function' ? globalThis.requestAnimationFrame.bind(globalThis) : (fn) => setTimeout(() => fn(Date.now()), 16));
  const caf = typeof options.cancelAnimationFrame === 'function' ? options.cancelAnimationFrame : (typeof globalThis.cancelAnimationFrame === 'function' ? globalThis.cancelAnimationFrame.bind(globalThis) : clearTimeout);
  let currentIndex = -1;
  let activeAudio = null;
  let nextAudio = null;
  let fadeFrame = null;
  let transitionStarted = false;
  let playing = false;
  let crossfadeSec = 8;

  const totalBytes = () => items.reduce((sum, item) => sum + item.size, 0);
  const publicItem = (item, index) => freeze({ id: item.id, name: item.name, type: item.type, size: item.size, source: item.source, current: index === currentIndex, userAuthorized: true, persistent: false });
  const snapshot = () => freeze({
    schema: EON_AUTO_DJ_PREVIEW_SCHEMA,
    itemCount: items.length,
    totalBytes: totalBytes(),
    currentIndex,
    playing,
    crossfadeSec,
    items: freeze(items.map(publicItem)),
    upload: false,
    persistentMediaStorage: false,
    beatMatching: false,
    tempoStretch: false,
    stems: false,
    exportedMix: false
  });

  const detach = (audio) => {
    if (!audio) return;
    try { audio.ontimeupdate = null; audio.onended = null; audio.onerror = null; } catch {}
  };
  const stopPlayers = () => {
    if (fadeFrame != null) { try { caf(fadeFrame); } catch {} fadeFrame = null; }
    for (const audio of [activeAudio, nextAudio]) {
      detach(audio);
      try { audio?.pause?.(); } catch {}
      try { if (audio) audio.currentTime = 0; } catch {}
    }
    activeAudio = null;
    nextAudio = null;
    transitionStarted = false;
    playing = false;
  };
  const audioFor = (item) => {
    const audio = audioFactory(item.objectUrl, item);
    if (!audio) return null;
    try { audio.volume = 1; } catch {}
    return audio;
  };
  const rampCrossfade = (from, to, seconds, done) => {
    const durationMs = Math.max(250, seconds * 1000);
    const started = Date.now();
    const tick = () => {
      const progress = Math.max(0, Math.min(1, (Date.now() - started) / durationMs));
      try { if (from) from.volume = Math.max(0, 1 - progress); } catch {}
      try { if (to) to.volume = Math.min(1, progress); } catch {}
      if (progress >= 1) { fadeFrame = null; done?.(); return; }
      fadeFrame = raf(tick);
    };
    fadeFrame = raf(tick);
  };

  const playIndex = async (index, { fadeIn = false } = {}) => {
    if (!items.length) return freeze({ ok: false, reason: 'auto-dj-session-empty', snapshot: snapshot() });
    const normalizedIndex = ((Math.floor(index) % items.length) + items.length) % items.length;
    const audio = audioFor(items[normalizedIndex]);
    if (!audio) return freeze({ ok: false, reason: 'browser-audio-unavailable', snapshot: snapshot() });
    currentIndex = normalizedIndex;
    activeAudio = audio;
    transitionStarted = false;
    try { audio.volume = fadeIn ? 0 : 1; } catch {}
    audio.ontimeupdate = () => {
      if (!playing || transitionStarted || items.length < 2) return;
      const duration = finite(audio.duration, 0);
      const remaining = duration > 0 ? duration - finite(audio.currentTime, 0) : Infinity;
      if (remaining <= crossfadeSec + 0.2) void transitionToNext();
    };
    audio.onended = () => { if (playing && !transitionStarted) void transitionToNext({ immediate: true }); };
    try {
      await audio.play();
      playing = true;
      return freeze({ ok: true, reason: 'auto-dj-preview-playing', current: publicItem(items[currentIndex], currentIndex), snapshot: snapshot() });
    } catch {
      detach(audio);
      activeAudio = null;
      playing = false;
      return freeze({ ok: false, reason: 'audio-playback-blocked-or-failed', snapshot: snapshot() });
    }
  };

  const transitionToNext = async ({ immediate = false } = {}) => {
    if (!playing || transitionStarted || items.length < 2 || !activeAudio) return;
    transitionStarted = true;
    const old = activeAudio;
    const nextIndex = (currentIndex + 1) % items.length;
    const incoming = audioFor(items[nextIndex]);
    if (!incoming) { transitionStarted = false; return; }
    nextAudio = incoming;
    try { incoming.volume = immediate ? 1 : 0; await incoming.play(); } catch { nextAudio = null; transitionStarted = false; return; }
    if (immediate) {
      detach(old); try { old.pause(); } catch {}
      activeAudio = incoming; nextAudio = null; currentIndex = nextIndex; transitionStarted = false;
      incoming.ontimeupdate = () => {
        if (!playing || transitionStarted || items.length < 2) return;
        const duration = finite(incoming.duration, 0);
        const remaining = duration > 0 ? duration - finite(incoming.currentTime, 0) : Infinity;
        if (remaining <= crossfadeSec + 0.2) void transitionToNext();
      };
      incoming.onended = () => { if (playing && !transitionStarted) void transitionToNext({ immediate: true }); };
      return;
    }
    rampCrossfade(old, incoming, crossfadeSec, () => {
      detach(old); try { old.pause(); } catch {}
      activeAudio = incoming; nextAudio = null; currentIndex = nextIndex; transitionStarted = false;
      incoming.ontimeupdate = () => {
        if (!playing || transitionStarted || items.length < 2) return;
        const duration = finite(incoming.duration, 0);
        const remaining = duration > 0 ? duration - finite(incoming.currentTime, 0) : Infinity;
        if (remaining <= crossfadeSec + 0.2) void transitionToNext();
      };
      incoming.onended = () => { if (playing && !transitionStarted) void transitionToNext({ immediate: true }); };
    });
  };

  const addMedia = (media, { explicitUserAction = false, source = 'user-authorized', name = '', type = '' } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', item: null, snapshot: snapshot() });
    if (!urlApi) return freeze({ ok: false, reason: 'object-url-api-unavailable', item: null, snapshot: snapshot() });
    const size = Math.max(0, finite(media?.size));
    const mediaName = clean(name || media?.name || `Track ${items.length + 1}`);
    const mediaType = clean(type || media?.type || 'audio/mpeg', 120);
    if (!media || !isAudioLike({ name: mediaName, type: mediaType })) return freeze({ ok: false, reason: 'audio-file-required', item: null, snapshot: snapshot() });
    if (size <= 0 || size > EON_AUTO_DJ_PREVIEW_MAX_ITEM_BYTES) return freeze({ ok: false, reason: 'audio-file-size-out-of-range', item: null, snapshot: snapshot() });
    if (items.length >= EON_AUTO_DJ_PREVIEW_MAX_ITEMS) return freeze({ ok: false, reason: 'auto-dj-item-limit', item: null, snapshot: snapshot() });
    if (totalBytes() + size > EON_AUTO_DJ_PREVIEW_MAX_TOTAL_BYTES) return freeze({ ok: false, reason: 'auto-dj-memory-budget', item: null, snapshot: snapshot() });
    const item = { id: makeId(), name: mediaName, type: mediaType, size, source: clean(source, 80) || 'user-authorized', media, objectUrl: urlApi.createObjectURL(media) };
    items.push(item);
    if (currentIndex < 0) currentIndex = 0;
    return freeze({ ok: true, reason: 'auto-dj-audio-added', item: publicItem(item, items.length - 1), snapshot: snapshot() });
  };

  const addFiles = (files = [], opts = {}) => {
    if (opts.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', added: freeze([]), rejected: freeze([]), snapshot: snapshot() });
    const added = []; const rejected = [];
    for (const file of Array.from(files || [])) {
      const result = addMedia(file, { explicitUserAction: true, source: 'user-authorized', name: file?.name, type: file?.type });
      if (result.ok) added.push(result.item); else rejected.push(freeze({ name: clean(file?.name || 'audio'), reason: result.reason }));
    }
    return freeze({ ok: added.length > 0, reason: added.length ? 'auto-dj-audio-added' : (rejected[0]?.reason || 'audio-file-required'), added: freeze(added), rejected: freeze(rejected), snapshot: snapshot() });
  };

  const addGeneratedBlob = (blob, metadata = {}, opts = {}) => addMedia(blob, {
    explicitUserAction: opts.explicitUserAction === true,
    source: 'eon-generated',
    name: clean(metadata.name || metadata.fileName || 'EON generated track.wav'),
    type: clean(metadata.type || blob?.type || 'audio/wav', 120)
  });

  const play = async (opts = {}) => {
    if (opts.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
    if (!items.length) return freeze({ ok: false, reason: 'auto-dj-session-empty', snapshot: snapshot() });
    stopPlayers();
    crossfadeSec = Math.max(2, Math.min(16, finite(opts.crossfadeSec, 8)));
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    return playIndex(startIndex);
  };
  const stop = (opts = {}) => {
    if (opts.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
    stopPlayers();
    return freeze({ ok: true, reason: 'auto-dj-preview-stopped', snapshot: snapshot() });
  };
  const clear = (opts = {}) => {
    if (opts.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
    stopPlayers();
    for (const item of items.splice(0)) { try { urlApi?.revokeObjectURL(item.objectUrl); } catch {} }
    currentIndex = -1;
    return freeze({ ok: true, reason: 'auto-dj-preview-cleared', snapshot: snapshot() });
  };

  return freeze({ schema: EON_AUTO_DJ_PREVIEW_SCHEMA, addFiles, addGeneratedBlob, play, stop, clear, snapshot });
}

export const eonAutoDjPreviewSession = createEonAutoDjPreviewSession();

export function getEonAutoDjPreviewTruth() {
  return freeze({
    schema: EON_AUTO_DJ_PREVIEW_SCHEMA,
    browserCrossfadePreview: true,
    sessionOnly: true,
    userAuthorizedAudioOnly: true,
    eonGeneratedAudioAllowed: true,
    upload: false,
    persistentMediaStorage: false,
    tempoStretch: false,
    beatGridAnalysis: false,
    stemSeparation: false,
    renderedMixExport: false,
    directPublishing: false
  });
}
