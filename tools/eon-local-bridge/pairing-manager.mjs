import { randomBytes } from 'node:crypto';

export const EON_LOCAL_COMPANION_PAIR_REQUEST_TTL_MS = 90_000;
export const EON_LOCAL_COMPANION_PAIR_REQUEST_LIMIT = 8;

function clean(value = '', max = 260) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

/**
 * Some embedded browsers omit the Origin header for a same-origin HTML form
 * submission.  Keep the local approval route usable there, but only when the
 * request itself is loopback-hosted and its Referer is the exact local
 * approval page.  Cross-origin form posts remain rejected.
 */
export function isEonLocalApprovalPostAllowed({ host = '', origin = '', referer = '', port = 17565 } = {}) {
  const localHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  const safeHost = clean(host, 120).toLowerCase();
  if (!localHosts.has(safeHost)) return false;

  const safeOrigin = clean(origin, 240).toLowerCase();
  if (localHosts.has(safeOrigin.replace(/^http:\/\//, ''))) return true;
  if (safeOrigin && safeOrigin !== 'null') return false;

  try {
    const source = new URL(clean(referer, 500));
    return source.protocol === 'http:' && localHosts.has(source.host.toLowerCase()) && source.pathname === '/pair/approve';
  } catch {
    return false;
  }
}

export function createEonLocalCompanionPairingManager({
  now = () => Date.now(),
  randomId = () => randomBytes(32).toString('base64url'),
  randomToken = () => randomBytes(32).toString('base64url'),
  ttlMs = EON_LOCAL_COMPANION_PAIR_REQUEST_TTL_MS,
  limit = EON_LOCAL_COMPANION_PAIR_REQUEST_LIMIT
} = {}) {
  const requests = new Map();

  function prune() {
    const at = now();
    for (const [id, entry] of requests) if (!entry || entry.expiresAt <= at || entry.consumed === true) requests.delete(id);
    while (requests.size > limit) requests.delete(requests.keys().next().value);
  }

  function create(origin = '', trustedBrowser = null) {
    prune();
    const safeOrigin = clean(origin, 240);
    if (!safeOrigin) return Object.freeze({ ok: false, error: 'pair-origin-required' });
    const safeTrustedBrowser = trustedBrowser && typeof trustedBrowser === 'object'
      ? Object.freeze({ keyId: clean(trustedBrowser.keyId || '', 120), publicKeyJwk: trustedBrowser.publicKeyJwk || null })
      : null;
    let id = '';
    do { id = clean(randomId(), 120); } while (!id || requests.has(id));
    const createdAt = now();
    const entry = {
      id,
      origin: safeOrigin,
      createdAt,
      expiresAt: createdAt + Math.max(15_000, Number(ttlMs) || EON_LOCAL_COMPANION_PAIR_REQUEST_TTL_MS),
      approvedAt: 0,
      token: '',
      consumed: false,
      trustedBrowser: safeTrustedBrowser?.keyId && safeTrustedBrowser?.publicKeyJwk ? safeTrustedBrowser : null
    };
    requests.set(id, entry);
    return Object.freeze({ ok: true, requestId: id, expiresAt: new Date(entry.expiresAt).toISOString() });
  }

  function inspect(requestId = '') {
    prune();
    const id = clean(requestId, 120);
    const entry = requests.get(id);
    if (!entry) return Object.freeze({ ok: false, error: 'pair-request-not-found' });
    return Object.freeze({
      ok: true,
      requestId: entry.id,
      origin: entry.origin,
      expiresAt: new Date(entry.expiresAt).toISOString(),
      approved: Boolean(entry.approvedAt),
      consumed: Boolean(entry.consumed)
    });
  }

  function approve(requestId = '') {
    prune();
    const id = clean(requestId, 120);
    const entry = requests.get(id);
    if (!entry) return Object.freeze({ ok: false, error: 'pair-request-not-found' });
    if (!entry.approvedAt) {
      entry.approvedAt = now();
      entry.token = clean(randomToken(), 180);
    }
    return Object.freeze({ ok: true, requestId: id, approved: true, origin: entry.origin, expiresAt: new Date(entry.expiresAt).toISOString(), trustedBrowser: entry.trustedBrowser });
  }

  function consume(requestId = '', origin = '') {
    prune();
    const id = clean(requestId, 120);
    const safeOrigin = clean(origin, 240);
    const entry = requests.get(id);
    if (!entry) return Object.freeze({ ok: false, error: 'pair-request-not-found' });
    if (entry.origin !== safeOrigin) return Object.freeze({ ok: false, error: 'pair-origin-mismatch' });
    if (!entry.approvedAt || !entry.token) return Object.freeze({ ok: true, pending: true, requestId: id, expiresAt: new Date(entry.expiresAt).toISOString() });
    const token = entry.token;
    entry.token = '';
    entry.consumed = true;
    requests.delete(id);
    return Object.freeze({ ok: true, pending: false, approved: true, requestId: id, token, expiresAt: new Date(now() + Math.max(15_000, Number(ttlMs) || EON_LOCAL_COMPANION_PAIR_REQUEST_TTL_MS)).toISOString() });
  }

  function clear() { requests.clear(); }

  return Object.freeze({ create, inspect, approve, consume, prune, clear, size: () => (prune(), requests.size) });
}
