/**
 * A15 I12 — one browser authority for device-loopback Local AI connections.
 *
 * The authority owns endpoint validation, session-only runtime credentials,
 * direct-versus-Bridge transport selection, cancellation, timeout handling,
 * redacted connection receipts and truthful locality state. It never probes a
 * LAN address, persists a credential to localStorage, retries a model request,
 * or silently falls back to a cloud provider.
 */
import {
  getLocalAiRuntimeContract,
  isApprovedLocalAiLoopbackEndpoint,
  normalizeLocalAiRuntimeId
} from '../../../config/local-ai-browser-contract.mjs';
import { classifyEonLocalBridgeTarget } from '../../../config/eon-local-bridge-contract.mjs';
import {
  clearEonLocalBridgeSession,
  fetchViaEonLocalBridge,
  readEonLocalBridgeSession,
  ensureEonLocalCompanionSession
} from './eon-local-bridge-client.js';

export const EON_LOCAL_CONNECTION_SCHEMA = 'eonapp.local-connection-authority.a15.v1';
export const EON_LOCAL_RUNTIME_CREDENTIAL_SESSION_KEY = 'eon:local-ai:runtime-credentials:a15:v1';
export const EON_LOCAL_CONNECTION_RECEIPT_SCHEMA = 'eonapp.local-connection-receipt.a15.v1';
const MAX_CREDENTIAL_LENGTH = 512;
const LOCAL_TEXT_RUNTIME_IDS = Object.freeze(['ollama', 'lmstudio', 'jan']);
const LOCAL_CONNECTION_RUNTIME_IDS = Object.freeze([...LOCAL_TEXT_RUNTIME_IDS, 'acestep']);

function sessionStore(store = null) {
  if (store) return store;
  try { return globalThis.sessionStorage || null; } catch { return null; }
}

function cleanText(value = '', max = 240) {
  return [...String(value || '')]
    .filter((char) => { const code = char.charCodeAt(0); return code >= 32 && code !== 127; })
    .join('').trim().slice(0, max);
}

function nowIso(now = Date.now()) {
  const value = typeof now === 'function' ? now() : now;
  return new Date(Number(value) || Date.now()).toISOString();
}

function readCredentialMap(store = null) {
  try {
    const raw = sessionStore(store)?.getItem(EON_LOCAL_RUNTIME_CREDENTIAL_SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeCredentialMap(next = {}, store = null) {
  const target = sessionStore(store);
  if (!target) return false;
  try {
    const serialized = JSON.stringify(next);
    target.setItem(EON_LOCAL_RUNTIME_CREDENTIAL_SESSION_KEY, serialized);
    return target.getItem(EON_LOCAL_RUNTIME_CREDENTIAL_SESSION_KEY) === serialized;
  } catch {
    return false;
  }
}

function normalizeCredentialRecord(value = {}) {
  const scheme = cleanText(value?.scheme || 'bearer', 24).toLowerCase();
  const token = cleanText(value?.token || value?.credential || '', MAX_CREDENTIAL_LENGTH);
  if (!token || scheme !== 'bearer') return null;
  return Object.freeze({ scheme, token, savedAt: cleanText(value?.savedAt || '', 80) });
}

export function saveLocalRuntimeSessionCredential({ runtimeName = '', runtimeId = '', credential = '', token = '', scheme = 'bearer' } = {}, { store = null, now = Date.now } = {}) {
  const id = normalizeLocalAiRuntimeId(runtimeId || runtimeName);
  if (!LOCAL_CONNECTION_RUNTIME_IDS.includes(id)) return Object.freeze({ ok: false, reason: 'runtime-not-supported' });
  const record = normalizeCredentialRecord({ scheme, token: token || credential, savedAt: nowIso(now) });
  if (!record) return Object.freeze({ ok: false, reason: 'credential-required' });
  const next = { ...readCredentialMap(store), [id]: record };
  if (!writeCredentialMap(next, store)) return Object.freeze({ ok: false, reason: 'session-storage-unavailable' });
  const verified = normalizeCredentialRecord(readCredentialMap(store)[id]);
  if (!verified || verified.token !== record.token) return Object.freeze({ ok: false, reason: 'credential-write-verification-failed' });
  return Object.freeze({ ok: true, runtimeId: id, scheme: record.scheme, savedAt: record.savedAt, sessionOnly: true, containsCredential: false });
}

export function hasLocalRuntimeSessionCredential(runtimeName = '', { store = null } = {}) {
  const id = normalizeLocalAiRuntimeId(runtimeName);
  return Boolean(id && normalizeCredentialRecord(readCredentialMap(store)[id]));
}

export function getLocalRuntimeSessionCredentialMetadata(runtimeName = '', { store = null } = {}) {
  const id = normalizeLocalAiRuntimeId(runtimeName);
  const record = normalizeCredentialRecord(readCredentialMap(store)[id]);
  if (!record) return null;
  return Object.freeze({ runtimeId: id, scheme: record.scheme, savedAt: record.savedAt, sessionOnly: true, containsCredential: false });
}

export function clearLocalRuntimeSessionCredential(runtimeName = '', { store = null } = {}) {
  const id = normalizeLocalAiRuntimeId(runtimeName);
  if (!id) return Object.freeze({ ok: false, reason: 'runtime-not-supported' });
  const next = { ...readCredentialMap(store) };
  delete next[id];
  if (!Object.keys(next).length) {
    try { sessionStore(store)?.removeItem(EON_LOCAL_RUNTIME_CREDENTIAL_SESSION_KEY); } catch { return Object.freeze({ ok: false, reason: 'session-storage-unavailable' }); }
    return Object.freeze({ ok: true, runtimeId: id });
  }
  return Object.freeze({ ok: writeCredentialMap(next, store), runtimeId: id });
}

export function clearAllLocalConnectionSessions({ store = null, clearBridge = true } = {}) {
  let credentialsCleared = true;
  try { sessionStore(store)?.removeItem(EON_LOCAL_RUNTIME_CREDENTIAL_SESSION_KEY); } catch { credentialsCleared = false; }
  const bridgeCleared = clearBridge ? clearEonLocalBridgeSession() : true;
  return Object.freeze({ ok: credentialsCleared && bridgeCleared, credentialsCleared, bridgeCleared });
}

function getCredentialRecord(runtimeId = '', store = null) {
  return normalizeCredentialRecord(readCredentialMap(store)[runtimeId]);
}

export function buildLocalRuntimeAuthorizationHeaders(runtimeName = '', { store = null } = {}) {
  const id = normalizeLocalAiRuntimeId(runtimeName);
  const record = getCredentialRecord(id, store);
  if (!record) return Object.freeze({});
  return Object.freeze({ authorization: `Bearer ${record.token}` });
}

function combineSignals(controller, externalSignal = null) {
  const abort = () => {
    try { controller.abort(externalSignal?.reason || 'local-request-cancelled'); } catch {}
  };
  if (externalSignal?.aborted) abort();
  else externalSignal?.addEventListener?.('abort', abort, { once: true });
  return () => externalSignal?.removeEventListener?.('abort', abort);
}

function endpointClass(url = '') {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port}`;
  } catch {
    return 'invalid';
  }
}

function suspectedCloudModel(model = '') {
  return /(?:cloud|remote|hosted)/i.test(cleanText(model, 160));
}

export function determineLocalRuntimeLocality({ model = '', requestSucceeded = false, offlineProofRequested = false, networkOnline = true } = {}) {
  if (suspectedCloudModel(model)) return 'cloud-backed-tag-blocked';
  if (requestSucceeded && offlineProofRequested && networkOnline === false) return 'offline-proven';
  if (requestSucceeded) return 'loopback-verified-offline-proof-pending';
  return 'unverified';
}

function buildReceipt({ runtimeId, target, transport, response = null, authenticated = false, model = '', offlineProofRequested = false, networkOnline = true, startedAt = 0, error = '' } = {}) {
  const status = Number(response?.status || 0) || 0;
  const requestSucceeded = Boolean(response?.ok);
  return Object.freeze({
    schema: EON_LOCAL_CONNECTION_RECEIPT_SCHEMA,
    runtimeId,
    transport,
    endpointClass: endpointClass(target?.url || ''),
    path: cleanText(target?.pathname || '', 120),
    authenticated,
    status,
    ok: requestSucceeded,
    localityState: determineLocalRuntimeLocality({ model, requestSucceeded, offlineProofRequested, networkOnline }),
    offlineProofRequested: offlineProofRequested === true,
    browserReportedOffline: networkOnline === false,
    elapsedMs: Math.max(0, Date.now() - Number(startedAt || Date.now())),
    error: cleanText(error, 120),
    containsCredential: false,
    containsPrompt: false,
    containsReply: false
  });
}

/**
 * Execute one approved loopback request. Once EON Local Companion is paired,
 * it is the preferred desktop transport so users do not need to configure CORS
 * or browser private-network settings in Ollama/LM Studio/Jan. If the Companion
 * transport itself is unreachable, direct loopback is attempted once. HTTP
 * failures are returned as-is and never hidden by a second model request.
 * The Companion is loopback-only and is never a cloud fallback.
 */
export async function requestLocalRuntime({
  runtimeName = '', runtimeId = '', url = '', method = 'GET', headers = {}, body = undefined,
  signal = null, timeoutMs = 15000, model = '', offlineProofRequested = false,
  networkOnline = globalThis.navigator?.onLine !== false, store = null,
  fetchImpl = globalThis.fetch, bridgeFetchImpl = fetchViaEonLocalBridge,
  allowBridge = true
} = {}) {
  const id = normalizeLocalAiRuntimeId(runtimeId || runtimeName);
  const runtime = getLocalAiRuntimeContract(id);
  if (!runtime || !LOCAL_CONNECTION_RUNTIME_IDS.includes(id)) throw new Error('local-runtime-not-supported');
  if (!isApprovedLocalAiLoopbackEndpoint(url, id)) throw new Error('local-runtime-endpoint-not-approved');
  const target = classifyEonLocalBridgeTarget(url, method);
  if (!target || target.runtimeId !== id) throw new Error('local-runtime-target-not-approved');
  if (typeof fetchImpl !== 'function') throw new Error('local-runtime-fetch-unavailable');

  const authHeaders = buildLocalRuntimeAuthorizationHeaders(id, { store });
  const authenticated = Boolean(authHeaders.authorization);
  const requestHeaders = { ...headers, ...authHeaders };
  const controller = new AbortController();
  const detachSignal = combineSignals(controller, signal);
  const timeout = setTimeout(() => {
    try { controller.abort('local-runtime-timeout'); } catch {}
  }, Math.max(1000, Number(timeoutMs) || 15000));
  const startedAt = Date.now();

  try {
    const companionSession = allowBridge && typeof bridgeFetchImpl === 'function'
      ? (await ensureEonLocalCompanionSession({ timeoutMs: Math.min(5000, Number(timeoutMs) || 5000) }))?.session || null
      : null;
    const pairedCompanion = Boolean(companionSession) && typeof bridgeFetchImpl === 'function';
    if (pairedCompanion) {
      try {
        const response = await bridgeFetchImpl(target.url, {
          method: target.method,
          headers: requestHeaders,
          body,
          signal: controller.signal
        }, { timeoutMs });
        return Object.freeze({ response, receipt: buildReceipt({ runtimeId: id, target, transport: 'paired-local-companion', response, authenticated, model, offlineProofRequested, networkOnline, startedAt }) });
      } catch (companionError) {
        if (controller.signal.aborted) throw companionError;
        try {
          const response = await fetchImpl(target.url, {
            method: target.method,
            headers: requestHeaders,
            body,
            signal: controller.signal,
            credentials: 'omit',
            redirect: 'error',
            cache: 'no-store'
          });
          return Object.freeze({ response, receipt: buildReceipt({ runtimeId: id, target, transport: 'direct-browser-recovery', response, authenticated, model, offlineProofRequested, networkOnline, startedAt }) });
        } catch (directError) {
          directError.cause = companionError;
          throw directError;
        }
      }
    }

    const response = await fetchImpl(target.url, {
      method: target.method,
      headers: requestHeaders,
      body,
      signal: controller.signal,
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store'
    });
    return Object.freeze({ response, receipt: buildReceipt({ runtimeId: id, target, transport: 'direct-browser', response, authenticated, model, offlineProofRequested, networkOnline, startedAt }) });
  } catch (errorLike) {
    const failure = errorLike instanceof Error ? errorLike : new Error(cleanText(errorLike || 'local-runtime-request-failed', 120));
    const reason = controller.signal.aborted ? (signal?.aborted ? 'cancelled' : 'timeout') : cleanText(failure.message || 'local-runtime-request-failed', 120);
    failure.localConnectionReceipt = buildReceipt({ runtimeId: id, target, transport: readEonLocalBridgeSession() ? 'companion-or-direct-failed' : 'direct-browser-failed', authenticated, model, offlineProofRequested, networkOnline, startedAt, error: reason });
    throw failure;
  } finally {
    clearTimeout(timeout);
    detachSignal();
  }
}

export async function requestLocalRuntimeJson(options = {}) {
  const result = await requestLocalRuntime(options);
  const text = await result.response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {
    if (result.response.ok) {
      const error = new Error('local-runtime-invalid-json');
      error.localConnectionReceipt = result.receipt;
      throw error;
    }
  }
  if (!result.response.ok) {
    const code = result.response.status === 401 || result.response.status === 403 ? 'local-runtime-authorization-required' : `local-runtime-http-${result.response.status}`;
    const error = new Error(code);
    error.localConnectionReceipt = result.receipt;
    error.status = result.response.status;
    error.payload = data;
    throw error;
  }
  return Object.freeze({ data, receipt: result.receipt });
}

export function getLocalConnectionAuthorityTruth() {
  return Object.freeze({
    schema: EON_LOCAL_CONNECTION_SCHEMA,
    runtimeIds: LOCAL_CONNECTION_RUNTIME_IDS,
    textRuntimeIds: LOCAL_TEXT_RUNTIME_IDS,
    mediaRuntimeIds: Object.freeze(['acestep']),
    credentialStorage: 'sessionStorage-only',
    directTransport: 'one-attempt',
    bridgeFallback: 'paired-companion-preferred-direct-loopback-recovery',
    cloudFallback: false,
    lanAllowed: false,
    arbitraryLoopbackPortsAllowed: false,
    offlineLocalityClaimRequiresSuccessfulOfflineSelfTest: true,
    receiptsContainCredentials: false
  });
}
