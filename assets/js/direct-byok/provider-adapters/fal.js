/** W626C/W626D — fal asynchronous queue adapter for the owner companion. */
import { assertDirectProviderApiEndpoint, assertDirectProviderMediaEndpoint } from '../direct-job-contract.js';
import { getDirectProvider } from '../provider-registry.js';

const policy = getDirectProvider('fal');
const freeze = Object.freeze;
const enc = encodeURIComponent;

function base(model) { return `https://queue.fal.run/${String(model.remoteId || '').replace(/^\/+|\/+$/g, '')}`; }
function headers(credential) {
  if (!credential) throw new Error('fal credential unavailable in secure companion storage');
  return freeze({
    Authorization: `Key ${credential}`,
    'Content-Type': 'application/json',
    // fal queue submissions otherwise receive provider-managed infrastructure
    // retries. EON Direct BYOK promises one explicitly approved paid job only,
    // so disable transparent provider retries and surface the failure to the user.
    'X-Fal-No-Retry': '1',
    // Bound queue-start wait so a browser/Companion interruption cannot leave an
    // approved job waiting indefinitely before a runner begins processing.
    // This does not cap inference once the job has started.
    'X-Fal-Request-Timeout': '900',
    // fal may otherwise route a failed request to an equivalent model endpoint.
    // EON's reviewed-model contract requires the exact approved model to run.
    'x-app-fal-disable-fallback': '1',
    // fal stores JSON request/response payloads for 30 days by default. The
    // Creator Companion already keeps only bounded redacted receipts, so opt out.
    'X-Fal-Store-IO': '0',
    // Generated provider media is copied into Companion memory immediately. Keep
    // the provider-side public object lifetime bounded to one hour.
    'X-Fal-Object-Lifecycle-Preference': JSON.stringify({ expiration_duration_seconds: 3600 })
  });
}
function checkApi(url) {
  const verdict = assertDirectProviderApiEndpoint(url, policy);
  if (!verdict.ok) throw new Error(`fal API endpoint rejected: ${verdict.reason}`);
  return url;
}
function checkMedia(url) {
  const verdict = assertDirectProviderMediaEndpoint(url, policy);
  if (!verdict.ok) throw new Error(`fal media endpoint rejected: ${verdict.reason}`);
  return url;
}

export function buildFalSubmitRequest(job, model, credential) {
  const url = checkApi(base(model));
  return freeze({ method: 'POST', url, headers: headers(credential), body: JSON.stringify(job.input), redirect: 'manual' });
}
export function buildFalStatusRequest(job, model, credential, requestId, statusUrl = '') {
  const url = checkApi(statusUrl || `${base(model)}/requests/${enc(requestId)}/status?logs=0`);
  return freeze({ method: 'GET', url, headers: headers(credential), redirect: 'manual' });
}
export function buildFalResultRequest(job, model, credential, requestId, responseUrl = '') {
  // fal currently documents both the convenience response_url (/response) and
  // the canonical REST result URL without it; prefer the server-returned URL.
  const url = checkApi(responseUrl || `${base(model)}/requests/${enc(requestId)}`);
  return freeze({ method: 'GET', url, headers: headers(credential), redirect: 'manual' });
}
export function buildFalCancelRequest(job, model, credential, requestId, cancelUrl = '') {
  const url = checkApi(cancelUrl || `${base(model)}/requests/${enc(requestId)}/cancel`);
  return freeze({ method: 'PUT', url, headers: headers(credential), redirect: 'manual' });
}

export function parseFalSubmit(payload = {}) {
  const requestId = String(payload.request_id || '').trim();
  if (!requestId) throw new Error('fal request id missing');
  for (const key of ['status_url', 'response_url', 'cancel_url']) if (payload[key]) checkApi(payload[key]);
  return freeze({
    requestId,
    state: 'queued',
    progress: null,
    authoritativeProgress: false,
    // Retain only provider-returned, allowlisted queue operation URLs. The REST
    // contract exposes these explicitly and they are safer than guessing paths.
    statusUrl: payload.status_url ? String(payload.status_url) : '',
    responseUrl: payload.response_url ? String(payload.response_url) : '',
    cancelUrl: payload.cancel_url ? String(payload.cancel_url) : ''
  });
}

export function parseFalStatus(payload = {}) {
  const state = String(payload.status || '').toUpperCase();
  if (state === 'IN_QUEUE') return freeze({ state: 'queued', progress: null, authoritativeProgress: false, code: 'in-queue' });
  if (state === 'IN_PROGRESS') return freeze({ state: 'running', progress: null, authoritativeProgress: false, code: 'in-progress' });
  if (state === 'COMPLETED' && payload.error) return freeze({ state: 'failed', progress: null, authoritativeProgress: false, code: String(payload.error_type || 'provider-failure') });
  if (state === 'COMPLETED') return freeze({ state: 'completed', progress: 100, authoritativeProgress: true, code: 'completed' });
  return freeze({ state: 'running', progress: null, authoritativeProgress: false, code: 'provider-state-unknown' });
}

function mediaRows(payload = {}, kind = 'image') {
  const candidates = kind === 'image'
    ? (Array.isArray(payload.images) ? payload.images : payload.image ? [payload.image] : [])
    : payload.video ? [payload.video] : Array.isArray(payload.videos) ? payload.videos : [];
  return candidates.map((row) => typeof row === 'string' ? { url: row } : row).filter((row) => row?.url).map((row) => {
    checkMedia(row.url);
    return freeze({ url: row.url, contentType: String(row.content_type || (kind === 'image' ? 'image/*' : 'video/*')), width: Number(row.width || 0), height: Number(row.height || 0), durationSeconds: Number(row.duration || 0) });
  });
}

export function parseFalResult(payload = {}, mediaKind = 'image') {
  const outputs = mediaRows(payload, mediaKind);
  if (!outputs.length) throw new Error('fal result did not contain an allowlisted media output');
  return freeze({ outputs: freeze(outputs), providerMetadata: freeze({ seedAvailable: Number.isFinite(Number(payload.seed)), moderationFlagAvailable: Array.isArray(payload.has_nsfw_concepts) }) });
}

export function getFalAdapterTruth() {
  return freeze({ providerId: 'fal', submit: true, status: true, cancel: true, result: true, redirectsAutomatic: false, automaticPaidRetry: false, providerAutomaticQueueRetryDisabled: true, automaticModelFallback: false, providerAutomaticModelFallbackDisabled: true, providerJsonRetentionControl: 'disabled-per-request', providerMediaRetentionControl: 'one-hour-lifecycle-preference', providerRetentionPolicyAuthority: 'fal-documented-platform-headers', credentialOwner: 'creator-companion-secure-store', realEndToEndProof: false });
}
