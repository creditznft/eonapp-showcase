/** W626B — browser client for the owner-controlled loopback Creator Companion. */
import { EON_CREATOR_COMPANION_ENDPOINT, EON_CREATOR_COMPANION_HOST, EON_CREATOR_COMPANION_PORT } from '../../../config/eon-creator-companion-browser-contract.mjs';

const freeze = Object.freeze;
export { EON_CREATOR_COMPANION_ENDPOINT };
export const EON_CREATOR_COMPANION_SESSION_KEY = 'eon:creator-companion:session:w626b:v1';

function approvedEndpoint(endpoint = '') {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'http:' && url.hostname === EON_CREATOR_COMPANION_HOST && Number(url.port) === EON_CREATOR_COMPANION_PORT && url.origin === EON_CREATOR_COMPANION_ENDPOINT;
  } catch { return false; }
}
function sessionStore(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function') return candidate;
  try { return globalThis.sessionStorage || null; } catch { return null; }
}
function readSession(store = null) {
  try {
    const parsed = JSON.parse(sessionStore(store)?.getItem(EON_CREATOR_COMPANION_SESSION_KEY) || 'null');
    return parsed?.token && Number(parsed.expiresAt || 0) > Date.now() ? parsed : null;
  } catch { return null; }
}
function writeSession(value, store = null) {
  sessionStore(store)?.setItem(EON_CREATOR_COMPANION_SESSION_KEY, JSON.stringify(value));
}
async function call(path, { method = 'GET', body = null, fetchImpl = globalThis.fetch, store = null, requireSession = true } = {}) {
  const url = `${EON_CREATOR_COMPANION_ENDPOINT}${path}`;
  if (!approvedEndpoint(url)) throw new Error('Creator Companion endpoint rejected');
  const session = readSession(store);
  if (requireSession && !session) throw new Error('Creator Companion pairing required');
  const headers = { Accept: 'application/json' };
  if (body !== null) headers['Content-Type'] = 'application/json';
  if (session) headers['X-EON-Companion-Session'] = session.token;
  const response = await fetchImpl(url, { method, headers, body: body === null ? undefined : JSON.stringify(body), redirect: 'error', cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error(`Creator Companion request failed (${response.status})`);
  return response.json();
}
async function callBinary(path, { expectedMediaKind = 'music', method = 'GET', fetchImpl = globalThis.fetch, store = null } = {}) {
  const url = `${EON_CREATOR_COMPANION_ENDPOINT}${path}`;
  if (!approvedEndpoint(url)) throw new Error('Creator Companion endpoint rejected');
  const session = readSession(store);
  if (!session) throw new Error('Creator Companion pairing required');
  const prefixes = Object.freeze({ image: 'image/', video: 'video/', music: 'audio/' });
  const prefix = prefixes[String(expectedMediaKind || '')];
  if (!prefix) throw new Error('Creator Companion media kind rejected');
  const response = await fetchImpl(url, { method, headers: { Accept: `${prefix}*`, 'X-EON-Companion-Session': session.token }, redirect: 'error', cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error(`Creator Companion output failed (${response.status})`);
  const type = String(response.headers?.get?.('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!type.startsWith(prefix)) throw new Error('Creator Companion returned an unexpected output type');
  const blob = await response.blob();
  return freeze({ ok: true, blob, mimeType: type, byteLength: blob.size, mediaKind: expectedMediaKind });
}

export async function scanCreatorCompanion(options = {}) {
  try {
    const payload = await call('/health', { ...options, requireSession: false });
    return freeze({ ok: payload?.schema === 'eon.creator-companion.health.w626b.v1', payload });
  } catch (error) { return freeze({ ok: false, reason: 'companion-not-reachable', message: String(error?.message || error) }); }
}
export async function beginCreatorCompanionPairing(options = {}) {
  return call('/v1/pair/start', { ...options, method: 'POST', body: {}, requireSession: false });
}
export async function confirmCreatorCompanionPairing({ challengeId, code }, options = {}) {
  const result = await call('/v1/pair/confirm', { ...options, method: 'POST', body: { challengeId, code }, requireSession: false });
  if (!result?.sessionToken || !result?.expiresAt) throw new Error('Creator Companion did not return a bounded session');
  writeSession({ token: result.sessionToken, expiresAt: Number(result.expiresAt) }, options.store);
  return freeze({ ok: true, expiresAt: Number(result.expiresAt) });
}
export async function listDirectProviders(options = {}) { return call('/v1/providers', options); }
export async function setDirectProviderCredential(providerId, credential, options = {}) { return call(`/v1/providers/${encodeURIComponent(providerId)}/credential`, { ...options, method: 'PUT', body: { credential: String(credential || '') } }); }
export async function deleteDirectProviderCredential(providerId, options = {}) { return call(`/v1/providers/${encodeURIComponent(providerId)}/credential`, { ...options, method: 'DELETE' }); }
export async function submitDirectJob(job, options = {}) { return call('/v1/jobs', { ...options, method: 'POST', body: job }); }
export async function readDirectJob(jobId, options = {}) { return call(`/v1/jobs/${encodeURIComponent(jobId)}`, options); }
export async function readDirectJobOutput(jobId, options = {}) { return callBinary(`/v1/jobs/${encodeURIComponent(jobId)}/output`, options); }
export async function cancelDirectJob(jobId, options = {}) { return call(`/v1/jobs/${encodeURIComponent(jobId)}/cancel`, { ...options, method: 'POST', body: {} }); }
export async function deleteCreatorCompanionSession({ store = null } = {}) { try { sessionStore(store)?.removeItem(EON_CREATOR_COMPANION_SESSION_KEY); } catch {} return freeze({ ok: true }); }
export function getCreatorCompanionClientTruth() { return freeze({ loopbackHost: EON_CREATOR_COMPANION_HOST, loopbackPort: EON_CREATOR_COMPANION_PORT, localhostAliasAllowed: false, lanAllowed: false, publicEndpointAllowed: false, sessionStorageOnly: true, permanentProviderCredentialInBrowser: false, providerCredentialMayMoveToOsVaultAfterExplicitPairedAction: true, binaryOutputFetchedFromCompanionMemoryOnly: true, binaryOutputKindChecked: true, providerOutputUrlExposedToBrowser: false }); }
