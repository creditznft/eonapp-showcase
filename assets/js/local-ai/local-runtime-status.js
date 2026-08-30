/**
 * Local AI runtime status — W228
 *
 * This module deliberately keeps Local AI proof browser-local. It stores only
 * the user-selected local runtime label, sanitized endpoint, model label and
 * self-test result. It never stores credentials, contacts a cloud service,
 * installs software, downloads a model, or runs a background process.
 */
import {
  getLocalAiRuntimeContract,
  isApprovedLocalAiLoopbackEndpoint,
  normalizeApprovedLocalAiEndpoint,
  normalizeLocalAiRuntimeId
} from '../../../config/local-ai-browser-contract.mjs';
import { normalizeEonAppW713ProviderReadiness } from '../runtime/w713/eonapp-w713-cross-route-product-coherence.js';
import { recordEonAiEvaluation } from '../ai-kernel/eon-ai-evaluation-ledger.js';
import {
  clearLocalRuntimeSessionCredential,
  getLocalRuntimeSessionCredentialMetadata,
  requestLocalRuntimeJson,
  saveLocalRuntimeSessionCredential
} from './eon-local-connection-authority.js';
export const LOCAL_RUNTIME_STATUS_KEY = 'eon:local-ai:runtime-status:v1';
export const LOCAL_RUNTIME_STATUS_SCHEMA = 'eon.local-ai.runtime-status.v1';
const LEGACY_RUNTIME_STATUS_KEY = 'eon:lite:runtime-status:v1';
const SELF_TEST_REPLY = 'EON LIVE OK';
export const LOCAL_FIRST_RUNTIME_PREFERENCE = 'local-first';

function storage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function cleanText(value = '', max = 180) {
  return [...String(value || '')]
    .filter((char) => { const code = char.charCodeAt(0); return code >= 32 && code !== 127; })
    .join('').trim().slice(0, max);
}

function fallbackEndpoint(runtimeName = '') {
  return getLocalAiRuntimeContract(runtimeName)?.defaultEndpoint || '';
}

/**
 * Compatibility helper for older callers. Without a runtime name it accepts
 * only one of the approved Local AI runtime/port combinations; it never treats
 * arbitrary LAN, RFC1918, or loopback ports as EONAPP Local AI.
 */
export function isDeviceLocalRuntimeEndpoint(value = '', runtimeName = '') {
  const runtime = normalizeLocalAiRuntimeId(runtimeName);
  if (runtime) return isApprovedLocalAiLoopbackEndpoint(value, runtime);
  return ['ollama', 'lmstudio', 'jan'].some((id) => isApprovedLocalAiLoopbackEndpoint(value, id));
}

/**
 * Local endpoint is necessary but not sufficient for local inference. Some
 * runtimes can expose cloud-backed tags through localhost. EONAPP Local mode
 * declines those tags so that a local endpoint cannot quietly become remote
 * processing. This is intentionally conservative.
 */
export function isLocalOnlyModelTag(value = '') {
  const model = cleanText(value, 160).toLowerCase();
  return Boolean(model) && !/(?:cloud|remote|hosted)/.test(model);
}

function cleanEndpoint(value = '', runtimeName = '') {
  const runtime = normalizeLocalAiRuntimeId(runtimeName);
  if (!runtime) return '';
  return normalizeApprovedLocalAiEndpoint(cleanText(value || fallbackEndpoint(runtime), 320), runtime);
}

function normalizeConnectionReceipt(value = {}) {
  if (!value || typeof value !== 'object') return null;
  return Object.freeze({
    schema: cleanText(value.schema || '', 80),
    runtimeId: cleanText(value.runtimeId || '', 40),
    transport: cleanText(value.transport || '', 60),
    endpointClass: cleanText(value.endpointClass || '', 100),
    path: cleanText(value.path || '', 120),
    authenticated: value.authenticated === true,
    status: Math.max(0, Number(value.status || 0) || 0),
    ok: value.ok === true,
    localityState: cleanText(value.localityState || '', 80),
    offlineProofRequested: value.offlineProofRequested === true,
    browserReportedOffline: value.browserReportedOffline === true,
    elapsedMs: Math.max(0, Number(value.elapsedMs || 0) || 0),
    containsCredential: false,
    containsPrompt: false,
    containsReply: false
  });
}

function normalizeStatus(value = {}) {
  if (!value || typeof value !== 'object') return null;
  const runtime = cleanText(value.runtime || value.runtimeName || '', 80);
  const runtimeId = normalizeLocalAiRuntimeId(value.runtimeId || runtime);
  const model = cleanText(value.model || '', 160);
  const endpoint = cleanEndpoint(value.endpoint || '', runtimeId || runtime);
  const checkedAt = cleanText(value.checkedAt || value.updatedAt || '', 80);
  const connectionReceipt = normalizeConnectionReceipt(value.connectionReceipt);
  const ok = value.ok === true;
  if (!runtime && !model && !checkedAt) return null;
  return Object.freeze({
    schema: LOCAL_RUNTIME_STATUS_SCHEMA,
    ok,
    runtime: runtime || getLocalAiRuntimeContract(runtimeId)?.label || 'Local runtime',
    runtimeId,
    model,
    endpoint,
    checkedAt,
    transport: cleanText(value.transport || connectionReceipt?.transport || '', 60),
    authenticated: value.authenticated === true || connectionReceipt?.authenticated === true,
    localityState: cleanText(value.localityState || connectionReceipt?.localityState || (ok ? 'loopback-verified-offline-proof-pending' : 'unverified'), 80),
    offlineProofAt: cleanText(value.offlineProofAt || '', 80),
    connectionReceipt,
    note: cleanText(value.note || '', 260)
  });
}

function readRaw(key) {
  try {
    const raw = storage()?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function readLocalRuntimeStatus() {
  const current = normalizeStatus(readRaw(LOCAL_RUNTIME_STATUS_KEY));
  if (current) return current;
  const legacy = normalizeStatus(readRaw(LEGACY_RUNTIME_STATUS_KEY));
  if (!legacy) return null;
  // A legacy record is normalized once into the neutral status key. The
  // original record is deliberately not removed so an interrupted upgrade
  // cannot erase a user-visible local setup state.
  try { storage()?.setItem(LOCAL_RUNTIME_STATUS_KEY, JSON.stringify(legacy)); } catch {}
  return legacy;
}


export function projectLocalRuntimeStatusForW713(value = readLocalRuntimeStatus()) {
  const status = value && typeof value === 'object' ? value : {};
  return normalizeEonAppW713ProviderReadiness({
    runtimeId: status.runtime,
    modelId: status.model,
    configured: Boolean(status.runtime || status.model),
    saved: Boolean(status.runtime || status.model || status.checkedAt),
    verified: status.ok === true,
    error: status.ok === false && status.note ? status.note : ''
  });
}

export function saveLocalRuntimeStatus(value = {}) {
  const next = normalizeStatus({ ...value, checkedAt: value.checkedAt || new Date().toISOString() });
  if (!next) return null;
  try {
    const target = storage();
    if (!target) return next;
    const serialized = JSON.stringify(next);
    target.setItem(LOCAL_RUNTIME_STATUS_KEY, serialized);
    if (target.getItem(LOCAL_RUNTIME_STATUS_KEY) !== serialized) return null;
  } catch { return null; }
  return next;
}

export function clearLocalRuntimeStatus({ model = '', runtimeName = '', id = '' } = {}) {
  const current = readLocalRuntimeStatus();
  if (model && current?.model && current.model !== model) return { ok: false, reason: 'different-model-selected' };
  const runtimeId = normalizeLocalAiRuntimeId(runtimeName || id || current?.runtimeId || current?.runtime || '');
  try { storage()?.removeItem(LOCAL_RUNTIME_STATUS_KEY); } catch { return { ok: false, reason: 'storage-unavailable' }; }
  if (runtimeId) clearLocalRuntimeSessionCredential(runtimeId);
  return { ok: true, runtimeId };
}

export function normalizeRuntimeEndpoint(endpoint = '', runtimeName = '') {
  return cleanEndpoint(endpoint, runtimeName);
}

function localRuntimeError(error) {
  const message = cleanText(error?.message || error || '', 220).toLowerCase();
  if (/cors|private network/.test(message)) return 'The browser blocked local-network access. Allow loopback/local-network access for the runtime, then try again.';
  if (/failed to fetch|network/.test(message)) return 'The local runtime was not reachable from this browser. If it is already installed, use the main Local AI setup or connect EON Local Companion from Advanced diagnostics rather than changing CORS/browser security or using a LAN address.';
  if (/timeout/.test(message)) return 'The local runtime did not respond before the self-test timed out.';
  if (/authorization-required|http[_-]401|http[_-]403/.test(message)) return 'The runtime requires authorization. Add its optional session credential, then retry. The credential is cleared when this browser session ends.';
  if (/bridge-not-paired/.test(message)) return 'Direct browser access was blocked and EON Local Companion is not connected for this browser session.';
  return 'The local runtime self-test could not complete.';
}

function normalizeSelfTestReply(value = '') {
  return cleanText(value, 240).replace(/\s+/g, ' ').trim().toLowerCase();
}

function localRuntimeSelfTestPassed(value = '') {
  return normalizeSelfTestReply(value).includes(SELF_TEST_REPLY.toLowerCase());
}

function normalizeDiscoveredModel(row = {}) {
  const model = cleanText(row.name || row.model || row.id || '', 160);
  if (!model) return null;
  return Object.freeze({
    model,
    localOnly: isLocalOnlyModelTag(model),
    sizeBytes: Math.max(0, Number(row.size || row.size_bytes || 0) || 0),
    modifiedAt: cleanText(row.modified_at || row.modifiedAt || row.created || '', 80),
    digest: cleanText(row.digest || row.id || '', 96)
  });
}

/**
 * Discover only models already exposed by a runtime on this device. This never
 * downloads a model or queries a cloud catalogue. Scanning happens only after
 * a user tap on the Local AI page.
 */
export async function discoverLocalRuntimeModels({ runtimeName = 'Ollama', endpoint = '', timeoutMs = 9000, credential = '' } = {}) {
  const runtime = cleanText(runtimeName || 'Local runtime', 80);
  const runtimeId = normalizeLocalAiRuntimeId(runtime);
  if (!isDeviceLocalRuntimeEndpoint(endpoint || fallbackEndpoint(runtime), runtime)) {
    return { ok: false, runtime, models: [], error: 'endpoint-not-device-local', message: 'Use the approved loopback endpoint and port for the selected runtime. LAN and arbitrary loopback ports are not allowed.' };
  }
  if (cleanText(credential, 512)) {
    const saved = saveLocalRuntimeSessionCredential({ runtimeId, credential });
    if (!saved.ok) return Object.freeze({ ok: false, runtime, models: Object.freeze([]), error: saved.reason, message: 'The optional runtime credential could not be stored for this browser session.' });
  }
  const base = cleanEndpoint(endpoint, runtime);
  const runtimeContract = getLocalAiRuntimeContract(runtime);
  const isOllama = runtimeContract?.id === 'ollama';
  const url = `${base.replace(/\/v1$/i, '')}${runtimeContract?.discoveryPath || ''}`;
  try {
    const result = await requestLocalRuntimeJson({ runtimeId, url, method: 'GET', headers: { accept: 'application/json' }, timeoutMs });
    const rows = isOllama ? result.data?.models : result.data?.data;
    const discovered = Array.isArray(rows) ? rows.map(normalizeDiscoveredModel).filter(Boolean).slice(0, 40) : [];
    const hiddenCloudModels = discovered.filter((row) => !row.localOnly).length;
    const models = discovered.filter((row) => row.localOnly);
    const suffix = hiddenCloudModels ? ` ${hiddenCloudModels} cloud-backed tag${hiddenCloudModels === 1 ? ' was' : 's were'} hidden from Local mode.` : '';
    return Object.freeze({
      ok: true,
      runtime,
      runtimeId,
      endpoint: base,
      models: Object.freeze(models),
      hiddenCloudModels,
      scannedAt: Date.now(),
      connectionReceipt: result.receipt,
      credential: getLocalRuntimeSessionCredentialMetadata(runtimeId),
      message: models.length ? `${models.length} installed local model${models.length === 1 ? '' : 's'} found through ${result.receipt.transport}.${suffix}` : `The runtime responded, but no installed local-only models were listed.${suffix}`
    });
  } catch (error) {
    return Object.freeze({ ok: false, runtime, runtimeId, endpoint: base, models: Object.freeze([]), error: 'local_runtime_discovery_failed', connectionReceipt: error?.localConnectionReceipt || null, message: localRuntimeError(error) });
  }
}

export async function runLocalRuntimeSelfTest({ runtimeName = 'Ollama', endpoint = '', model = '', timeoutMs = 15000, credential = '', offlineProofRequested = false, networkOnline = globalThis.navigator?.onLine !== false } = {}) {
  const runtime = cleanText(runtimeName || 'Local runtime', 80);
  const runtimeId = normalizeLocalAiRuntimeId(runtime);
  const selectedModel = cleanText(model, 160);
  if (!isDeviceLocalRuntimeEndpoint(endpoint || fallbackEndpoint(runtime), runtime)) {
    const status = saveLocalRuntimeStatus({ ok: false, runtime, runtimeId, model: selectedModel, endpoint: fallbackEndpoint(runtime), note: 'Use the approved loopback endpoint and port for the selected runtime. LAN and arbitrary loopback ports are not allowed.' });
    return { ok: false, status, error: 'endpoint-not-device-local', message: status?.note || 'Endpoint is not device-local.' };
  }
  const base = cleanEndpoint(endpoint, runtime);
  if (!selectedModel) {
    const status = saveLocalRuntimeStatus({ ok: false, runtime, runtimeId, model: '', endpoint: base, note: 'Choose a local model name before running the self-test.' });
    return { ok: false, status, error: 'missing_local_model' };
  }
  if (!isLocalOnlyModelTag(selectedModel)) {
    const status = saveLocalRuntimeStatus({ ok: false, runtime, runtimeId, model: selectedModel, endpoint: base, localityState: 'cloud-backed-tag-blocked', note: 'Cloud-backed model tags are not available in EONAPP Local mode.' });
    return { ok: false, status, error: 'model-not-local-only', message: status?.note || 'Choose a local-only model.' };
  }
  if (offlineProofRequested && networkOnline !== false) {
    const status = saveLocalRuntimeStatus({ ok: false, runtime, runtimeId, model: selectedModel, endpoint: base, localityState: 'offline-proof-requires-browser-offline', note: 'Turn off internet connectivity first, then run the explicit offline locality proof again.' });
    return { ok: false, status, error: 'offline-proof-requires-browser-offline', message: status?.note };
  }
  if (cleanText(credential, 512)) {
    const saved = saveLocalRuntimeSessionCredential({ runtimeId, credential });
    if (!saved.ok) return { ok: false, error: saved.reason, message: 'The optional runtime credential could not be stored for this browser session.' };
  }
  const runtimeContract = getLocalAiRuntimeContract(runtime);
  const isOllama = runtimeContract?.id === 'ollama';
  const url = isOllama
    ? `${base.replace(/\/v1$/i, '')}/api/generate`
    : `${base.replace(/\/v1$/i, '')}${runtimeContract?.chatPath || ''}`;
  const body = isOllama
    ? { model: selectedModel, stream: false, prompt: `Reply with exactly: ${SELF_TEST_REPLY}`, options: { num_predict: 24, temperature: 0 } }
    : { model: selectedModel, temperature: 0, max_tokens: 24, messages: [{ role: 'user', content: `Reply with exactly: ${SELF_TEST_REPLY}` }] };
  const selfTestStartedAt = Date.now();
  try {
    const result = await requestLocalRuntimeJson({ runtimeId, url, method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), timeoutMs, model: selectedModel, offlineProofRequested, networkOnline });
    const text = String(result.data?.response || result.data?.message?.content || result.data?.choices?.[0]?.message?.content || '').trim();
    const passed = localRuntimeSelfTestPassed(text);
    const localityState = result.receipt?.localityState || 'unverified';
    const offlineProven = passed && localityState === 'offline-proven';
    recordEonAiEvaluation({
      providerId: runtimeId,
      modelId: selectedModel,
      taskType: 'self-test',
      local: true,
      success: passed,
      latencyMs: Math.max(0, Date.now() - selfTestStartedAt),
      qualityScore: passed ? 100 : 0,
      outputReceiptValid: Boolean(result.receipt),
      failureClass: passed ? '' : 'self-test-response-mismatch'
    }, { explicitForegroundTest: true });
    const status = saveLocalRuntimeStatus({
      ok: passed,
      runtime,
      runtimeId,
      model: selectedModel,
      endpoint: base,
      transport: result.receipt?.transport || '',
      authenticated: result.receipt?.authenticated === true,
      localityState,
      offlineProofAt: offlineProven ? new Date().toISOString() : '',
      connectionReceipt: result.receipt,
      note: passed
        ? `${offlineProven ? 'Offline locality proof passed.' : 'Loopback self-test passed; offline locality proof remains pending.'} Local mode still has no web, publishing, messaging, trading, or external-action access.`
        : 'The runtime replied, but the neutral local self-test response was not confirmed.'
    });
    return { ok: passed, status, reply: cleanText(text, 240), connectionReceipt: result.receipt, error: passed ? '' : 'local_runtime_response_not_confirmed' };
  } catch (error) {
    recordEonAiEvaluation({
      providerId: runtimeId,
      modelId: selectedModel,
      taskType: 'self-test',
      local: true,
      success: false,
      latencyMs: Math.max(0, Date.now() - selfTestStartedAt),
      qualityScore: 0,
      failureClass: 'local-runtime-self-test-failed'
    }, { explicitForegroundTest: true });
    const receipt = error?.localConnectionReceipt || null;
    const status = saveLocalRuntimeStatus({ ok: false, runtime, runtimeId, model: selectedModel, endpoint: base, transport: receipt?.transport || '', authenticated: receipt?.authenticated === true, localityState: receipt?.localityState || 'unverified', connectionReceipt: receipt, note: localRuntimeError(error) });
    return { ok: false, status, connectionReceipt: receipt, error: 'local_runtime_self_test_failed', message: status?.note || localRuntimeError(error) };
  }
}


export function migrateLocalRuntimePreference(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const next = { ...source };
  if (next.runtimePreference === 'local') next.runtimePreference = LOCAL_FIRST_RUNTIME_PREFERENCE;
  if (next.mode === 'local') next.mode = LOCAL_FIRST_RUNTIME_PREFERENCE;
  if (next.runtimeMode === 'local') next.runtimeMode = LOCAL_FIRST_RUNTIME_PREFERENCE;
  return next;
}

export function readLocalRuntimeChatSettings() {
  try {
    const existing = JSON.parse(storage()?.getItem('eon:ai-chat-settings:v1') || '{}');
    const migrated = migrateLocalRuntimePreference(existing);
    if (JSON.stringify(existing) !== JSON.stringify(migrated)) storage()?.setItem('eon:ai-chat-settings:v1', JSON.stringify(migrated));
    return migrated;
  } catch {
    return {};
  }
}

export function markLocalRuntimeAsChatRuntime({ runtimeName = 'Ollama', endpoint = '', model = '' } = {}) {
  const runtime = cleanText(runtimeName || 'Ollama', 80);
  const provider = normalizeLocalAiRuntimeId(runtime);
  const selectedModel = cleanText(model, 160);
  if (!isDeviceLocalRuntimeEndpoint(endpoint || fallbackEndpoint(runtime), runtime)) {
    return { ok: false, error: 'endpoint-not-device-local' };
  }
  const base = cleanEndpoint(endpoint, runtime);
  if (!selectedModel) return { ok: false, error: 'missing_local_model' };
  if (!isLocalOnlyModelTag(selectedModel)) return { ok: false, error: 'model-not-local-only' };
  const proof = readLocalRuntimeStatus();
  if (!proof?.ok || proof.runtimeId !== provider || proof.model !== selectedModel || proof.endpoint !== base) {
    return { ok: false, error: 'matching-self-test-required' };
  }
  if (proof.localityState === 'cloud-backed-tag-blocked') return { ok: false, error: 'model-not-local-only' };
  const next = { provider, model: selectedModel, endpoint: provider === 'ollama' ? base : `${base.replace(/\/v1$/i, '')}/v1`, policyTier: 'local-private', runtimePreference: LOCAL_FIRST_RUNTIME_PREFERENCE, mode: LOCAL_FIRST_RUNTIME_PREFERENCE, localityState: proof.localityState, localTransport: proof.transport };
  try {
    const existing = readLocalRuntimeChatSettings();
    storage()?.setItem('eon:ai-chat-settings:v1', JSON.stringify({ ...existing, ...next }));
  } catch { return { ok: false, error: 'unable_to_save_chat_runtime_preference' }; }
  return { ok: true, settings: next };
}

export function unmarkLocalRuntimeChatRuntime({ model = '' } = {}) {
  try {
    const existing = readLocalRuntimeChatSettings();
    if (!['ollama', 'jan', 'lmstudio'].includes(String(existing?.provider || '').toLowerCase()) || (model && existing.model !== model)) {
      return { ok: false, reason: 'selected-model-is-not-active-chat-runtime' };
    }
    const next = { ...existing };
    for (const key of ['provider', 'model', 'endpoint', 'policyTier', 'runtimePreference', 'mode']) delete next[key];
    storage()?.setItem('eon:ai-chat-settings:v1', JSON.stringify(next));
    return { ok: true };
  } catch { return { ok: false, reason: 'unable_to_clear_chat_runtime_preference' }; }
}

export const LOCAL_RUNTIME_SELF_TEST_REPLY = SELF_TEST_REPLY;
