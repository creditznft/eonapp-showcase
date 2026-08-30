/**
 * W606 — client-only research ledger.
 *
 * Stores bounded, user-selected public-source extracts in the current browser.
 * It makes no network call except an explicit browser-direct CORS request the
 * user starts, and it never routes a source, API key, prompt, or response via
 * an EONAPP server, Cloudflare Worker, or proxy.
 */
import {
  EON_CLIENT_RESEARCH_MAX_FETCH_BYTES,
  EON_CLIENT_RESEARCH_MAX_SOURCES,
  buildEonClientResearchPacket,
  cleanResearchExcerpt,
  createEonClientResearchSource,
  evaluateEonClientResearchRequest,
  safePublicResearchUrl
} from '../../../config/eon-client-research-contract.mjs';

export const EON_CLIENT_RESEARCH_LEDGER_SCHEMA = 'eonapp.w606.client-research-ledger.v1';
export const EON_CLIENT_RESEARCH_LEDGER_KEY = 'eon:ai-client-research-ledger:v1';
export const EON_CLIENT_RESEARCH_QUEUE_KEY = 'eon:ai-client-research-queue:v1';

function getStorage(storage = null, fallbackName = 'localStorage') {
  const candidate = storage || globalThis?.[fallbackName];
  return candidate && typeof candidate.getItem === 'function' && typeof candidate.setItem === 'function' && typeof candidate.removeItem === 'function' ? candidate : null;
}

function safeParse(raw = '') {
  try { return JSON.parse(String(raw || '')); } catch { return null; }
}

function canonicalSource(value = {}) {
  const result = createEonClientResearchSource(value);
  return result.ok ? result.source : null;
}

function readLedger(storage = null) {
  const target = getStorage(storage);
  if (!target) return Object.freeze({ schema: EON_CLIENT_RESEARCH_LEDGER_SCHEMA, sources: Object.freeze([]) });
  const parsed = safeParse(target.getItem(EON_CLIENT_RESEARCH_LEDGER_KEY));
  const sourceRows = Array.isArray(parsed?.sources) ? parsed.sources : [];
  const sources = [];
  const seen = new Set();
  for (const row of sourceRows) {
    const source = canonicalSource(row);
    if (!source || seen.has(source.url)) continue;
    seen.add(source.url);
    sources.push(source);
    if (sources.length >= EON_CLIENT_RESEARCH_MAX_SOURCES) break;
  }
  return Object.freeze({ schema: EON_CLIENT_RESEARCH_LEDGER_SCHEMA, sources: Object.freeze(sources) });
}

function writeLedger(sources = [], storage = null) {
  const target = getStorage(storage);
  if (!target) return false;
  const sanitized = [];
  const seen = new Set();
  for (const row of sources) {
    const source = canonicalSource(row);
    if (!source || seen.has(source.url)) continue;
    seen.add(source.url);
    sanitized.push(source);
    if (sanitized.length >= EON_CLIENT_RESEARCH_MAX_SOURCES) break;
  }
  try {
    target.setItem(EON_CLIENT_RESEARCH_LEDGER_KEY, JSON.stringify({ schema: EON_CLIENT_RESEARCH_LEDGER_SCHEMA, sources: sanitized }));
    return true;
  } catch {
    return false;
  }
}

export function listEonClientResearchSources(options = {}) {
  return readLedger(options.storage).sources;
}

export function saveEonClientResearchSource(input = {}, options = {}) {
  if (options.explicitUserAction !== true) return Object.freeze({ ok: false, reason: 'explicit-user-action-required', source: null });
  const normalized = createEonClientResearchSource(input, options);
  if (!normalized.ok) return Object.freeze({ ok: false, reason: normalized.errors[0] || 'invalid-source', errors: normalized.errors, source: null });
  const prior = listEonClientResearchSources(options).filter((source) => source.url !== normalized.source.url && source.id !== normalized.source.id);
  const saved = writeLedger([normalized.source, ...prior], options.storage);
  return Object.freeze({ ok: saved, reason: saved ? null : 'storage-unavailable', source: normalized.source, count: saved ? Math.min(prior.length + 1, EON_CLIENT_RESEARCH_MAX_SOURCES) : prior.length });
}

export function removeEonClientResearchSource(id = '', options = {}) {
  const targetId = String(id || '').trim();
  const sources = listEonClientResearchSources(options).filter((source) => source.id !== targetId);
  const saved = writeLedger(sources, options.storage);
  return Object.freeze({ ok: saved, id: targetId });
}

export function clearEonClientResearchSources(options = {}) {
  const target = getStorage(options.storage);
  if (!target) return false;
  try {
    target.removeItem(EON_CLIENT_RESEARCH_LEDGER_KEY);
    getStorage(options.sessionStorage, 'sessionStorage')?.removeItem(EON_CLIENT_RESEARCH_QUEUE_KEY);
    return true;
  } catch {
    return false;
  }
}

function contentType(response = {}) {
  try { return String(response?.headers?.get?.('content-type') || '').toLowerCase(); } catch { return ''; }
}

async function readTextAtMost(response, maxBytes = EON_CLIENT_RESEARCH_MAX_FETCH_BYTES) {
  const reader = response?.body?.getReader?.();
  if (!reader) {
    const text = await response.text();
    return String(text || '').slice(0, maxBytes);
  }
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    const chunk = next.value || new Uint8Array();
    bytes += chunk.byteLength || chunk.length || 0;
    if (bytes > maxBytes) {
      try { await reader.cancel(); } catch {}
      throw new Error('research-source-too-large');
    }
    text += decoder.decode(chunk, { stream: true });
  }
  return text + decoder.decode();
}

/**
 * Browser-direct fetch for public HTTPS sources that opt into CORS. Failure is
 * expected for many websites and is never bypassed through a proxy.
 */
export async function fetchEonClientResearchSource(input = {}, options = {}) {
  if (options.explicitUserAction !== true) return Object.freeze({ ok: false, reason: 'explicit-user-action-required', source: null });
  const url = safePublicResearchUrl(input?.url || '');
  if (!url) return Object.freeze({ ok: false, reason: 'public-https-source-url-required', source: null });
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') return Object.freeze({ ok: false, reason: 'browser-fetch-unavailable', source: null });
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'text/html, text/plain;q=0.9, application/xhtml+xml;q=0.8' }
    });
    if (!response?.ok) return Object.freeze({ ok: false, reason: `source-http-${Number(response?.status || 0) || 'error'}`, source: null });
    const type = contentType(response);
    if (type && !/^(text\/html|text\/plain|application\/xhtml\+xml)(?:;|$)/.test(type)) return Object.freeze({ ok: false, reason: 'source-content-type-not-supported', source: null });
    const body = await readTextAtMost(response);
    const saved = saveEonClientResearchSource({
      title: input?.title || '',
      url,
      excerpt: cleanResearchExcerpt(body),
      method: 'browser-cors-fetch',
      capturedAt: input?.capturedAt || new Date().toISOString()
    }, { ...options, explicitUserAction: true });
    return saved.ok
      ? Object.freeze({ ok: true, reason: null, source: saved.source, fetchedDirectly: true })
      : Object.freeze({ ok: false, reason: saved.reason || 'source-save-failed', source: null });
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    return Object.freeze({
      ok: false,
      reason: message.includes('too-large') ? 'research-source-too-large' : 'cors-or-network-blocked',
      source: null,
      detail: 'This source did not permit a browser-direct readable fetch. Open it yourself and paste a short permitted extract instead; EONAPP will not proxy it.'
    });
  }
}

function uniqueSourceIds(ids = []) {
  const sourceIds = [];
  const seen = new Set();
  for (const id of Array.isArray(ids) ? ids : []) {
    const clean = String(id || '').trim();
    if (!/^eonrs_[a-z0-9_-]{8,96}$/i.test(clean) || seen.has(clean)) continue;
    seen.add(clean);
    sourceIds.push(clean);
    if (sourceIds.length >= EON_CLIENT_RESEARCH_MAX_SOURCES) break;
  }
  return sourceIds;
}

export function queueEonClientResearchForNextTurn(input = {}, options = {}) {
  const session = getStorage(options.sessionStorage, 'sessionStorage');
  if (!session) return Object.freeze({ ok: false, reason: 'session-storage-unavailable', packet: null });
  const all = listEonClientResearchSources(options);
  const requestedIds = uniqueSourceIds(input?.sourceIds || all.map((source) => source.id));
  const sources = all.filter((source) => requestedIds.includes(source.id));
  const request = evaluateEonClientResearchRequest(input?.query || '', { explicitUserAction: input?.explicitUserAction === true, sourceCount: sources.length });
  if (!request.ok) return Object.freeze({ ok: false, reason: request.errors[0] || 'research-request-blocked', request, packet: null });
  const packet = buildEonClientResearchPacket({ query: request.query, sources }, options);
  try {
    session.setItem(EON_CLIENT_RESEARCH_QUEUE_KEY, JSON.stringify({ schema: EON_CLIENT_RESEARCH_LEDGER_SCHEMA, query: request.query, sourceIds: sources.map((source) => source.id), queuedAt: new Date(Number(options.now || Date.now())).toISOString() }));
    return Object.freeze({ ok: true, reason: null, request, packet });
  } catch {
    return Object.freeze({ ok: false, reason: 'session-storage-unavailable', request, packet: null });
  }
}

export function peekEonClientResearchPacket(options = {}) {
  const session = getStorage(options.sessionStorage, 'sessionStorage');
  if (!session) return buildEonClientResearchPacket({}, options);
  const queued = safeParse(session.getItem(EON_CLIENT_RESEARCH_QUEUE_KEY));
  const ids = uniqueSourceIds(queued?.sourceIds || []);
  const sources = listEonClientResearchSources(options).filter((source) => ids.includes(source.id));
  return buildEonClientResearchPacket({ query: queued?.query || '', sources }, options);
}

/** Consumes the one-turn selection. Nothing is injected automatically after this call. */
export function consumeEonClientResearchPacket(options = {}) {
  const session = getStorage(options.sessionStorage, 'sessionStorage');
  const packet = peekEonClientResearchPacket(options);
  try { session?.removeItem(EON_CLIENT_RESEARCH_QUEUE_KEY); } catch {}
  return packet;
}

export function getEonClientResearchTruth() {
  return Object.freeze({
    schema: EON_CLIENT_RESEARCH_LEDGER_SCHEMA,
    scope: 'same-browser-local-only',
    directBrowserCorsFetch: true,
    manualSourceCapture: true,
    browserExtensionBridgeInstalled: false,
    cloudflareWorker: false,
    eonappServerProxy: false,
    providerKeyStoredByEonapp: false,
    automaticModelBrowsing: false,
    automaticMemorySave: false,
    oneTurnExplicitContextQueue: true
  });
}
