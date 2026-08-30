

export const EON_DISPLAY_CONSENT_KEY = 'eon:monetization:display-consent:v1';
const CACHE_MS = 15_000;
let cached = null;

function freeze(value) { return Object.freeze(value); }
function storageOf(environment = globalThis) { try { return environment?.localStorage || null; } catch { return null; } }

export function readDisplayAdConsent(environment = globalThis) {
  try {
    const raw = storageOf(environment)?.getItem(EON_DISPLAY_CONSENT_KEY) || '';
    if (!raw) return freeze({ state: 'unknown', updatedAt: 0 });
    const value = JSON.parse(raw);
    const state = ['allowed', 'denied'].includes(value?.state) ? value.state : 'unknown';
    return freeze({ state, updatedAt: Number(value?.updatedAt || 0) });
  } catch { return freeze({ state: 'unknown', updatedAt: 0 }); }
}

export function setDisplayAdConsent(state = 'unknown', { explicitUserAction = false, environment = globalThis } = {}) {
  const normalized = ['allowed', 'denied'].includes(String(state || '').toLowerCase()) ? String(state).toLowerCase() : 'unknown';
  if (!explicitUserAction) return freeze({ ok: false, state: readDisplayAdConsent(environment).state, reason: 'explicit_user_action_required' });
  try {
    const storage = storageOf(environment);
    if (!storage) return freeze({ ok: false, state: 'unknown', reason: 'storage_unavailable' });
    if (normalized === 'unknown') storage.removeItem(EON_DISPLAY_CONSENT_KEY);
    else storage.setItem(EON_DISPLAY_CONSENT_KEY, JSON.stringify({ state: normalized, updatedAt: Date.now(), version: 1 }));
    return freeze({ ok: true, state: normalized });
  } catch { return freeze({ ok: false, state: 'unknown', reason: 'storage_unavailable' }); }
}

export async function fetchMonetizationStatus({ force = false, environment = globalThis } = {}) {
  if (!force && cached && Date.now() - cached.at < CACHE_MS) return cached.value;
  try {
    const response = await environment.fetch('/api/monetization/status', { credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' } });
    const body = await response.json().catch(() => ({}));
    const value = freeze({ ...body, httpOk: response.ok, status: response.status });
    cached = { at: Date.now(), value };
    return value;
  } catch { return freeze({ ok: false, httpOk: false, status: 0, active: false, display: { eligible: false }, rewarded: { eligible: false }, reason: 'monetization_status_unavailable' }); }
}

export function emitMonetizationEvent(name = '', detail = {}, environment = globalThis) {
  const safe = {
    event: String(name || '').slice(0, 64),
    provider: String(detail?.provider || '').slice(0, 32),
    slot: String(detail?.slot || '').slice(0, 64),
    surface: String(detail?.surface || '').slice(0, 64),
    format: String(detail?.format || '').slice(0, 32),
    reason: String(detail?.reason || '').slice(0, 64),
    at: Date.now()
  };
  try { environment.dispatchEvent?.(new CustomEvent('eon:monetization-event', { detail: safe })); } catch {}
  return freeze(safe);
}
