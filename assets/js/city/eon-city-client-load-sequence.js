/**
 * W554C — EON City truthful client-side loading sequence.
 *
 * The sequence is intentionally engine-neutral. It can display meaningful
 * stage progress before any binary art exists, then accepts actual stream byte
 * progress from the approved W649 content-hashed static asset manifest. It never
 * reports a fake byte percentage and never sends City loading events remotely.
 */
import {
  EON_CITY_CLIENT_DELIVERY,
  EON_CITY_CLIENT_LOAD_SCHEMA,
  createEonCityClientLoadSnapshot,
  describeEonCityLoadProgress,
  getEonCityLoadStage,
  normalizeDirectStaticEonCityAssetPath
} from '../../../config/w554c-eon-city-client-load-contract.mjs';
import { describeEonCityAssetCacheStatus } from './eon-city-asset-cache-policy.js';

const loadSequences = new WeakMap();

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}


function normalizeLoaderFacts(facts = []) {
  return (Array.isArray(facts) ? facts : [])
    .map((fact, index) => ({
      id: String(fact?.id || `fact-${index + 1}`).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-') || `fact-${index + 1}`,
      label: String(fact?.label || 'Status').trim() || 'Status',
      value: String(fact?.value || 'Checking…').trim() || 'Checking…',
      state: ['ready', 'warning', 'error'].includes(String(fact?.state || '').trim().toLowerCase()) ? String(fact.state).trim().toLowerCase() : 'loading'
    }))
    .slice(0, 4);
}

function clampBytes(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
}

function safeLoadStatus(value = '') {
  return value === 'ready' || value === 'error' ? value : 'loading';
}

export class EonCityClientLoadSequence {
  constructor({ quality = 'balanced', directEntry = true, onUpdate = null } = {}) {
    this.quality = String(quality || 'balanced');
    this.directEntry = directEntry === true;
    this.listeners = new Set();
    this.current = createEonCityClientLoadSnapshot({ stage: 'access-check' });
    if (typeof onUpdate === 'function') this.listeners.add(onUpdate);
  }

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this.listeners.add(listener);
    listener(this.current);
    return () => this.listeners.delete(listener);
  }

  emit(next) {
    const currentProgress = Number(this.current?.progress || 0);
    const incomingProgress = Number(next?.progress || 0);
    // The visual bar represents ordered boot-stage progress, not a fabricated
    // aggregate byte percentage. Individual asset byte truth remains in the
    // accessible detail while the bar never moves backwards between files.
    const visible = next?.status === 'loading' && incomingProgress < currentProgress
      ? Object.freeze({ ...next, progress: currentProgress })
      : next;
    this.current = visible;
    for (const listener of [...this.listeners]) {
      try { listener(visible); } catch {}
    }
    return visible;
  }

  advance(stage, { detail = '', asset = null, cache = undefined, status = 'loading' } = {}) {
    const nextStage = getEonCityLoadStage(stage);
    const currentStage = getEonCityLoadStage(this.current.stage);
    // A cancelled/retried async task must not visually move the City backwards.
    const normalizedStage = nextStage.index < currentStage.index && safeLoadStatus(status) === 'loading'
      ? currentStage.id
      : nextStage.id;
    return this.emit(createEonCityClientLoadSnapshot({ stage: normalizedStage, detail, asset, cache: cache === undefined ? this.current.cache : cache, status }));
  }

  reportCacheStatus(cache = {}) {
    return this.advance(this.current.stage, {
      detail: describeEonCityAssetCacheStatus(cache),
      asset: this.current.asset,
      cache
    });
  }

  startAsset(asset = {}) {
    const sourcePath = normalizeDirectStaticEonCityAssetPath(asset.sourcePath || '');
    if (!sourcePath) return this.fail('asset-path-not-approved');
    return this.advance('art-streaming', {
      detail: String(asset.detail || 'Streaming approved City art directly to this browser.'),
      asset: {
        id: asset.id || 'city-asset',
        sourcePath,
        loadedBytes: 0,
        totalBytes: clampBytes(asset.totalBytes),
        directStatic: true
      }
    });
  }

  reportAssetBytes({ id = '', sourcePath = '', loadedBytes = 0, totalBytes = 0, detail = '' } = {}) {
    const current = this.current.asset || {};
    const approvedPath = normalizeDirectStaticEonCityAssetPath(sourcePath || current.sourcePath || '');
    if (!approvedPath) return this.fail('asset-path-not-approved');
    const safeTotal = clampBytes(totalBytes || current.totalBytes);
    const safeLoaded = safeTotal > 0 ? Math.min(clampBytes(loadedBytes), safeTotal) : clampBytes(loadedBytes);
    return this.advance('art-streaming', {
      detail: String(detail || 'Streaming approved City art directly to this browser.'),
      asset: {
        id: id || current.id || 'city-asset',
        sourcePath: approvedPath,
        loadedBytes: safeLoaded,
        totalBytes: safeTotal,
        directStatic: true
      }
    });
  }

  ready(detail = '') {
    return this.advance('first-frame', { detail: String(detail || 'Command Horizon is ready to explore.'), cache: this.current.cache, status: 'ready' });
  }

  fail(detail = '') {
    return this.emit(createEonCityClientLoadSnapshot({
      stage: this.current.stage,
      detail: String(detail || 'City loading stopped safely before the first frame.'),
      asset: this.current.asset,
      cache: this.current.cache,
      status: 'error'
    }));
  }

  getSnapshot() {
    return this.current;
  }
}

export function createEonCityClientLoadSequence(options = {}) {
  return new EonCityClientLoadSequence(options);
}

export function bindEonCityClientLoadSequence(root, sequence) {
  if (!root || !sequence?.getSnapshot) return null;
  loadSequences.set(root, sequence);
  return sequence;
}

export function getEonCityClientLoadSequence(root) {
  return root ? (loadSequences.get(root) || null) : null;
}

export function releaseEonCityClientLoadSequence(root) {
  if (!root) return false;
  return loadSequences.delete(root);
}

export function renderEonCityClientLoadMarkup(snapshot = {}, { title = 'Loading Command Horizon', kicker = 'EON UNIVERSE · local entry', facts = [] } = {}) {
  const safe = createEonCityClientLoadSnapshot(snapshot);
  const progressText = describeEonCityLoadProgress(safe);
  const cacheText = describeEonCityAssetCacheStatus(safe.cache || {});
  const factRows = normalizeLoaderFacts(facts);
  const factsMarkup = factRows.length
    ? `<dl class="eon-city-client-loader-facts" aria-label="City preparation facts">${factRows.map((fact) => `<div data-eon-city-load-fact="${escapeHtml(fact.id)}" data-state="${escapeHtml(fact.state)}"><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join('')}</dl>`
    : '';
  const assetText = safe.asset?.totalBytes > 0
    ? `${Math.round(safe.asset.loadedBytes / 1024)} KB of ${Math.round(safe.asset.totalBytes / 1024)} KB received directly by this browser.`
    : safe.stage === 'art-streaming'
      ? 'Waiting for direct static asset byte progress.'
      : 'No project, Vault, prompt, provider key, file, or chat content is loading into the City.';
  return `
    <section class="eon-city-client-loader" data-eon-city-client-loader aria-live="polite" aria-labelledby="eon-city-client-loader-title" data-eon-city-load-status="${escapeHtml(safe.status)}">
      <div class="eon-city-client-loader-art" aria-hidden="true"><span class="eon-city-client-loader-orbit"></span><span class="eon-city-client-loader-horizon"></span><span class="eon-city-client-loader-rain"></span></div>
      <div class="eon-city-client-loader-copy">
        <p class="eon-play-kicker">${escapeHtml(kicker)}</p>
        <h1 id="eon-city-client-loader-title">${escapeHtml(title)}</h1>
        <p data-eon-city-load-label>${escapeHtml(safe.label)}</p>
        <div class="eon-city-client-loader-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${safe.progress}" aria-valuetext="${escapeHtml(progressText)}"><span data-eon-city-load-progress style="width:${safe.progress}%"></span></div>
        <div class="eon-city-client-loader-status"><strong data-eon-city-load-stage>${escapeHtml(progressText)}</strong><span data-eon-city-load-detail>${escapeHtml(safe.detail)}</span></div>
        ${factsMarkup}
        <p class="eon-city-client-loader-note" data-eon-city-load-cache-note>${escapeHtml(cacheText)}</p>
        <p class="eon-city-client-loader-note" data-eon-city-load-asset-note>${escapeHtml(assetText)}</p>
        <p class="eon-city-client-loader-note">Direct client delivery · unchanged content-hashed City assets keep the same URL across app releases · no Pages Function asset relay · no remote telemetry.</p>
      </div>
    </section>`;
}

export function mountEonCityClientLoadScreen(root, sequence, options = {}) {
  if (!root || !sequence?.subscribe) return Object.freeze({ dispose: () => {} });
  const render = (snapshot) => {
    const facts = typeof options.getFacts === 'function' ? options.getFacts(snapshot) : options.facts;
    root.innerHTML = renderEonCityClientLoadMarkup(snapshot, { ...options, facts });
  };
  const unsubscribe = sequence.subscribe(render);
  return Object.freeze({ dispose: unsubscribe, render });
}

/**
 * Fetch an approved content-hashed static City binary directly in the browser.
 * This helper does not call EONAPP APIs, does not attach tokens, and never uses
 * the Pages Function experiment path. Every caller must use a provenance-reviewed
 * path from the approved static manifest.
 */
export async function fetchDirectStaticEonCityAsset(sourcePath, { fetchImpl = globalThis.fetch, signal, onProgress = null } = {}) {
  const path = normalizeDirectStaticEonCityAssetPath(sourcePath);
  if (!path) return Object.freeze({ ok: false, reason: 'asset-path-not-approved', bytes: null, loadedBytes: 0, totalBytes: 0, directStatic: false });
  if (typeof fetchImpl !== 'function') return Object.freeze({ ok: false, reason: 'fetch-unavailable', bytes: null, loadedBytes: 0, totalBytes: 0, directStatic: true });
  let response;
  try {
    response = await fetchImpl(path, { method: 'GET', credentials: 'same-origin', cache: 'force-cache', signal, headers: { accept: 'application/octet-stream,*/*;q=0.8' } });
  } catch {
    return Object.freeze({ ok: false, reason: 'asset-request-failed', bytes: null, loadedBytes: 0, totalBytes: 0, directStatic: true, sourcePath: path });
  }
  if (!response?.ok) return Object.freeze({ ok: false, reason: `asset-response-${response?.status || 0}`, bytes: null, loadedBytes: 0, totalBytes: 0, directStatic: true, sourcePath: path });
  const totalBytes = clampBytes(response.headers?.get?.('content-length') || 0);
  const reader = response.body?.getReader?.();
  if (!reader) {
    const bytes = await response.arrayBuffer();
    const loadedBytes = bytes.byteLength;
    onProgress?.({ sourcePath: path, loadedBytes, totalBytes: totalBytes || loadedBytes, directStatic: true });
    return Object.freeze({ ok: true, bytes, loadedBytes, totalBytes: totalBytes || loadedBytes, directStatic: true, sourcePath: path, contentType: response.headers?.get?.('content-type') || '' });
  }
  const chunks = [];
  let loadedBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loadedBytes += value.byteLength || 0;
        onProgress?.({ sourcePath: path, loadedBytes, totalBytes, directStatic: true });
      }
    }
  } catch {
    try { await reader.cancel?.(); } catch {}
    return Object.freeze({ ok: false, reason: 'asset-stream-failed', bytes: null, loadedBytes, totalBytes, directStatic: true, sourcePath: path });
  }
  const output = new Uint8Array(loadedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength || 0;
  }
  const bytes = output.buffer;
  onProgress?.({ sourcePath: path, loadedBytes, totalBytes: totalBytes || loadedBytes, directStatic: true });
  return Object.freeze({ ok: true, bytes, loadedBytes, totalBytes: totalBytes || loadedBytes, directStatic: true, sourcePath: path, contentType: response.headers?.get?.('content-type') || '' });
}

export function getEonCityClientDeliverySummary() {
  return Object.freeze({
    ...EON_CITY_CLIENT_DELIVERY,
    approvedDirectStaticPrefixes: Object.freeze([...EON_CITY_CLIENT_DELIVERY.approvedDirectStaticPrefixes])
  });
}

export const EON_CITY_CLIENT_LOAD_RUNTIME_SCHEMA = EON_CITY_CLIENT_LOAD_SCHEMA;
