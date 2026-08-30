/**
 * Local-only chat thread store.
 *
 * EONAPP does not publish, sync, or share these threads. This module exists so
 * the Chat-first shell can create, title, rename, restore, and delete chats in
 * the current browser profile without mixing them with Vault records.
 */
export const CHAT_THREADS_STORAGE_KEY = 'eon:chat:threads:v1';
export const ACTIVE_CHAT_THREAD_STORAGE_KEY = 'eon:chat:active-thread:v1';
export const LEGACY_CHAT_SESSION_STORAGE_KEY = 'eon:chat-history:v2';
export const CHAT_THREAD_SCHEMA = 'eon.chat.threads.v2';
export const MAX_CHAT_THREADS = 40;
export const MAX_PINNED_CHAT_THREADS = 8;
export const MAX_THREAD_MESSAGES = 80;

function getStorage(storage = null) {
  if (storage) return storage;
  // W332: raw Chat content defaults to tab/session lifetime. Durable recovery is
  // an explicit encrypted Vault backup, never a plaintext browser profile cache.
  try { return globalThis.sessionStorage || null; } catch { return null; }
}

function getSessionStorage(storage = null) {
  if (storage) return storage;
  try { return globalThis.sessionStorage || null; } catch { return null; }
}

function getLegacyPersistentStorage(storage = null) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function nowIso(now = Date.now()) {
  const value = Number(now);
  return new Date(Number.isFinite(value) ? value : Date.now()).toISOString();
}

function cleanText(value = '', max = 2800) {
  return Array.from(String(value || ''), (character) => ((character.codePointAt(0) || 0) < 32 ? ' ' : character))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function sanitizeSpeechMetadata(value = null) {
  if (!value || typeof value !== 'object') return null;
  const locale = cleanText(value.locale, 18).replace(/_/g, '-');
  const preference = cleanText(value.preference || value.languagePreference || 'auto', 18).replace(/_/g, '-');
  if (!locale || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/i.test(locale)) return null;
  const normalizedPreference = preference && preference !== 'auto' && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/i.test(preference) ? preference : 'auto';
  return { locale, preference: normalizedPreference };
}

function makeId(random = '') {
  const supplied = cleanText(random, 96).replace(/[^a-zA-Z0-9_-]/g, '');
  if (supplied) return `chat_${supplied.slice(0, 88)}`;
  try {
    if (globalThis.crypto?.randomUUID) return `chat_${globalThis.crypto.randomUUID().replace(/-/g, '')}`;
  } catch {}
  return `chat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function sanitizeMessage(entry = {}) {
  if (!entry || typeof entry !== 'object') return null;
  const role = entry.role === 'user' ? 'user' : 'bot';
  const text = cleanText(entry.text, 2800);
  if (!text) return null;
  const meta = entry.meta && typeof entry.meta === 'object'
    ? {
        provider: cleanText(entry.meta.provider, 64),
        model: cleanText(entry.meta.model, 120),
        local: Boolean(entry.meta.local),
        elapsedMs: Number.isFinite(entry.meta.elapsedMs) ? Math.max(0, Math.floor(entry.meta.elapsedMs)) : null
      }
    : null;
  const toolCTA = entry.toolCTA && typeof entry.toolCTA === 'object'
    ? { label: cleanText(entry.toolCTA.label, 80), url: cleanText(entry.toolCTA.url, 600) }
    : null;
  const actionCTA = entry.actionCTA && typeof entry.actionCTA === 'object'
    ? { label: cleanText(entry.actionCTA.label, 80), action: cleanText(entry.actionCTA.action, 80) }
    : null;
  const quickReplies = Array.isArray(entry.quickReplies)
    ? entry.quickReplies.map((value) => cleanText(value, 80)).filter(Boolean).slice(0, 6)
    : [];
  return {
    role,
    text,
    source: entry.source === 'ai' ? 'ai' : role === 'user' ? 'user' : 'guide',
    meta,
    speech: sanitizeSpeechMetadata(entry.speech),
    toolCTA: toolCTA?.label && toolCTA?.url ? toolCTA : null,
    actionCTA: actionCTA?.label && actionCTA?.action ? actionCTA : null,
    quickReplies
  };
}

export function deriveChatThreadTitle(messages = [], fallback = 'New chat') {
  const candidates = Array.isArray(messages) ? messages : [];
  const preferred = candidates.find((entry) => entry?.role === 'user' && cleanText(entry?.text, 140));
  const secondary = candidates.find((entry) => cleanText(entry?.text, 140));
  const raw = cleanText(preferred?.text || secondary?.text || fallback, 72);
  if (!raw) return 'New chat';
  return raw.length > 56 ? `${raw.slice(0, 55).trimEnd()}…` : raw;
}

function normalizeThread(raw = {}, now = Date.now()) {
  if (!raw || typeof raw !== 'object') return null;
  const id = cleanText(raw.id, 112).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!id) return null;
  const messages = Array.isArray(raw.messages)
    ? raw.messages.map(sanitizeMessage).filter(Boolean).slice(-MAX_THREAD_MESSAGES)
    : [];
  const titleSource = raw.titleSource === 'manual' ? 'manual' : 'generated';
  const title = cleanText(raw.title, 72) || deriveChatThreadTitle(messages);
  const createdAt = typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : nowIso(now);
  const updatedAt = typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : createdAt;
  return { id, title, titleSource, createdAt, updatedAt, pinned: Boolean(raw.pinned), messages };
}

function readPayload(storage = null, now = Date.now()) {
  const target = getStorage(storage);
  try {
    const parsed = JSON.parse(target?.getItem(CHAT_THREADS_STORAGE_KEY) || 'null');
    const rawThreads = Array.isArray(parsed?.threads) ? parsed.threads : Array.isArray(parsed) ? parsed : [];
    const seen = new Set();
    const threads = rawThreads
      .map((entry) => normalizeThread(entry, now))
      .filter((entry) => entry && !seen.has(entry.id) && seen.add(entry.id))
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
        return String(b.updatedAt).localeCompare(String(a.updatedAt));
      })
      .slice(0, MAX_CHAT_THREADS);
    return { schema: CHAT_THREAD_SCHEMA, threads };
  } catch {
    return { schema: CHAT_THREAD_SCHEMA, threads: [] };
  }
}

function persistPayload(threads = [], storage = null) {
  const target = getStorage(storage);
  if (!target) return false;
  try {
    target.setItem(CHAT_THREADS_STORAGE_KEY, JSON.stringify({ schema: CHAT_THREAD_SCHEMA, threads: threads.slice(0, MAX_CHAT_THREADS) }));
    return true;
  } catch {
    return false;
  }
}

function setActiveId(id = '', storage = null) {
  const target = getStorage(storage);
  try {
    if (!id) target?.removeItem(ACTIVE_CHAT_THREAD_STORAGE_KEY);
    else target?.setItem(ACTIVE_CHAT_THREAD_STORAGE_KEY, id);
    return true;
  } catch {
    return false;
  }
}

function getActiveId(storage = null) {
  try { return cleanText(getStorage(storage)?.getItem(ACTIVE_CHAT_THREAD_STORAGE_KEY), 112).replace(/[^a-zA-Z0-9_-]/g, ''); } catch { return ''; }
}

function createThread({ title = 'New chat', titleSource = 'generated', messages = [], now = Date.now(), id = '' } = {}) {
  const safeMessages = Array.isArray(messages) ? messages.map(sanitizeMessage).filter(Boolean).slice(-MAX_THREAD_MESSAGES) : [];
  return {
    id: makeId(id),
    title: cleanText(title, 72) || deriveChatThreadTitle(safeMessages),
    titleSource: titleSource === 'manual' ? 'manual' : 'generated',
    createdAt: nowIso(now),
    updatedAt: nowIso(now),
    pinned: false,
    messages: safeMessages
  };
}

function extractRequestedThreadId(search = '') {
  try { return cleanText(new URLSearchParams(String(search || '')).get('thread'), 112).replace(/[^a-zA-Z0-9_-]/g, ''); } catch { return ''; }
}

function parseLegacySession(sessionStorage = null) {
  try {
    const raw = JSON.parse(getSessionStorage(sessionStorage)?.getItem(LEGACY_CHAT_SESSION_STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw.map(sanitizeMessage).filter(Boolean).slice(-MAX_THREAD_MESSAGES) : [];
  } catch {
    return [];
  }
}

/** Returns only non-content privacy state for the current Chat thread policy. */
export function getChatThreadStorageTruth() {
  return Object.freeze({
    schema: CHAT_THREAD_SCHEMA,
    defaultStorage: 'session-only',
    durablePlaintextChatStorage: false,
    encryptedBackupRequiredForRecovery: true,
    cloudSync: false,
    rawChatRelay: false
  });
}

/** Detects plaintext thread rows created by older releases without reading them into Chat. */
export function getLegacyPlaintextChatThreadStatus(options = {}) {
  const storage = getLegacyPersistentStorage(options.storage);
  try {
    const raw = storage?.getItem(CHAT_THREADS_STORAGE_KEY) || '';
    return Object.freeze({ present: Boolean(raw), key: CHAT_THREADS_STORAGE_KEY, contentLoaded: false });
  } catch {
    return Object.freeze({ present: false, key: CHAT_THREADS_STORAGE_KEY, contentLoaded: false });
  }
}

/** Explicit user-cleanup action. It never migrates or uploads old plaintext threads. */
export function clearLegacyPlaintextChatThreads(options = {}) {
  const storage = getLegacyPersistentStorage(options.storage);
  try {
    storage?.removeItem(CHAT_THREADS_STORAGE_KEY);
    storage?.removeItem(ACTIVE_CHAT_THREAD_STORAGE_KEY);
    return Object.freeze({ ok: true, contentUploaded: false, contentMigrated: false });
  } catch {
    return Object.freeze({ ok: false, contentUploaded: false, contentMigrated: false });
  }
}

export function listChatThreads(options = {}) {
  return readPayload(options.storage, options.now).threads;
}

export function getActiveChatThread(options = {}) {
  const threads = listChatThreads(options);
  const id = getActiveId(options.storage);
  return threads.find((thread) => thread.id === id) || null;
}

export function resolveChatThread(options = {}) {
  const now = Number(options.now || Date.now());
  const payload = readPayload(options.storage, now);
  const requestedId = extractRequestedThreadId(options.search);
  const activeId = requestedId || getActiveId(options.storage);
  let thread = payload.threads.find((entry) => entry.id === activeId) || payload.threads[0] || null;
  let migrated = false;
  let created = false;

  if (!thread) {
    const legacyMessages = parseLegacySession(options.sessionStorage);
    thread = createThread({
      title: legacyMessages.length ? deriveChatThreadTitle(legacyMessages, 'Previous chat') : 'New chat',
      messages: legacyMessages,
      now
    });
    payload.threads = [thread];
    migrated = legacyMessages.length > 0;
    created = true;
  }

  persistPayload(payload.threads, options.storage);
  setActiveId(thread.id, options.storage);
  return { thread, created, migrated, requestedId };
}

export function createNewChatThread(options = {}) {
  const now = Number(options.now || Date.now());
  const payload = readPayload(options.storage, now);
  const thread = createThread({ title: options.title || 'New chat', now, id: options.id || '' });
  const threads = [thread, ...payload.threads].slice(0, MAX_CHAT_THREADS);
  persistPayload(threads, options.storage);
  setActiveId(thread.id, options.storage);
  return thread;
}

export function updateChatThreadMessages(threadId = '', messages = [], options = {}) {
  const now = Number(options.now || Date.now());
  const payload = readPayload(options.storage, now);
  const id = cleanText(threadId, 112).replace(/[^a-zA-Z0-9_-]/g, '');
  const index = payload.threads.findIndex((entry) => entry.id === id);
  if (index < 0) return null;
  const current = payload.threads[index];
  const safeMessages = Array.isArray(messages) ? messages.map(sanitizeMessage).filter(Boolean).slice(-MAX_THREAD_MESSAGES) : [];
  const next = {
    ...current,
    messages: safeMessages,
    title: current.titleSource === 'manual' ? current.title : deriveChatThreadTitle(safeMessages, current.title || 'New chat'),
    updatedAt: nowIso(now)
  };
  const threads = [next, ...payload.threads.filter((entry) => entry.id !== id)].slice(0, MAX_CHAT_THREADS);
  persistPayload(threads, options.storage);
  setActiveId(next.id, options.storage);
  return next;
}

export function renameChatThread(threadId = '', title = '', options = {}) {
  const now = Number(options.now || Date.now());
  const payload = readPayload(options.storage, now);
  const id = cleanText(threadId, 112).replace(/[^a-zA-Z0-9_-]/g, '');
  const index = payload.threads.findIndex((entry) => entry.id === id);
  const nextTitle = cleanText(title, 72);
  if (index < 0 || !nextTitle) return null;
  const next = { ...payload.threads[index], title: nextTitle, titleSource: 'manual', updatedAt: nowIso(now) };
  const threads = [next, ...payload.threads.filter((entry) => entry.id !== id)].slice(0, MAX_CHAT_THREADS);
  persistPayload(threads, options.storage);
  return next;
}

/** Pins a local session-only chat for quicker access. Pinning never uploads or shares chat content. */
export function setChatThreadPinned(threadId = '', pinned = true, options = {}) {
  const now = Number(options.now || Date.now());
  const payload = readPayload(options.storage, now);
  const id = cleanText(threadId, 112).replace(/[^a-zA-Z0-9_-]/g, '');
  const index = payload.threads.findIndex((entry) => entry.id === id);
  if (index < 0) return { ok: false, reason: 'thread-not-found', thread: null };
  const shouldPin = Boolean(pinned);
  const current = payload.threads[index];
  if (shouldPin && !current.pinned) {
    const count = payload.threads.filter((entry) => Boolean(entry.pinned)).length;
    if (count >= MAX_PINNED_CHAT_THREADS) return { ok: false, reason: 'pin-limit', thread: current };
  }
  const next = { ...current, pinned: shouldPin, updatedAt: nowIso(now) };
  const threads = [next, ...payload.threads.filter((entry) => entry.id !== id)]
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return String(b.updatedAt).localeCompare(String(a.updatedAt));
    })
    .slice(0, MAX_CHAT_THREADS);
  persistPayload(threads, options.storage);
  return { ok: true, reason: shouldPin ? 'pinned' : 'unpinned', thread: next };
}

export function deleteChatThread(threadId = '', options = {}) {
  const now = Number(options.now || Date.now());
  const payload = readPayload(options.storage, now);
  const id = cleanText(threadId, 112).replace(/[^a-zA-Z0-9_-]/g, '');
  const remaining = payload.threads.filter((entry) => entry.id !== id);
  persistPayload(remaining, options.storage);
  const active = getActiveId(options.storage);
  if (active === id) setActiveId(remaining[0]?.id || '', options.storage);
  return { deleted: payload.threads.length !== remaining.length, nextThread: remaining[0] || null };
}

export function clearChatThreadMessages(threadId = '', options = {}) {
  return updateChatThreadMessages(threadId, [], options);
}

export function getChatThreadQuery(threadId = '') {
  const id = cleanText(threadId, 112).replace(/[^a-zA-Z0-9_-]/g, '');
  return id ? `/?thread=${encodeURIComponent(id)}` : '/';
}
